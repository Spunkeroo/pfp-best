// Content Moderation for pfp.best
// Uses nsfwjs (TensorFlow.js) to detect explicit content client-side

const Moderation = {
  model: null,
  modelLoading: false,
  modelReady: false,

  // Strictly allowed image MIME types — no SVG (XSS risk), no BMP, no TIFF
  ALLOWED_TYPES: new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]),

  // Probability above which an image is blocked
  EXPLICIT_THRESHOLD: 0.60,

  // Validate file type before even reading the file
  validateFileType(file) {
    return this.ALLOWED_TYPES.has(file.type.toLowerCase());
  },

  // Pre-load the NSFW model so it's ready when the user submits
  async loadModel() {
    if (this.model) return this.model;
    if (this.modelLoading) {
      // Wait up to 15s for in-progress load
      for (let i = 0; i < 150; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (this.model) return this.model;
      }
      return null;
    }

    this.modelLoading = true;
    try {
      // Quantized model — faster load, same accuracy
      this.model = await nsfwjs.load('https://nsfwjs.com/quant_nsfw_model/', { size: 299 });
      this.modelReady = true;
      console.log('[Moderation] NSFW model loaded');
    } catch (err) {
      console.error('[Moderation] Failed to load NSFW model:', err);
      this.model = null;
    } finally {
      this.modelLoading = false;
    }
    return this.model;
  },

  // Check an <img> element for explicit content
  // Returns { safe: bool, reason: string|null, scores: object }
  async checkImage(imgElement) {
    let model;
    try {
      model = await this.loadModel();
    } catch (err) {
      // Model unavailable (common on mobile) — allow upload
      console.warn('[Moderation] Model load error, allowing upload:', err);
      return { safe: true, reason: null, scores: {} };
    }

    if (!model) {
      // Model unavailable (mobile, memory limits, etc.) — allow upload
      console.warn('[Moderation] Model unavailable, allowing upload without scan');
      return { safe: true, reason: null, scores: {} };
    }

    try {
      const predictions = await model.classify(imgElement);
      const scores = {};
      predictions.forEach(p => { scores[p.className] = p.probability; });

      const pornScore   = scores['Porn']   || 0;
      const hentaiScore = scores['Hentai'] || 0;

      // Block if either explicit category is above threshold
      const isExplicit = pornScore > this.EXPLICIT_THRESHOLD || hentaiScore > this.EXPLICIT_THRESHOLD;

      return {
        safe: !isExplicit,
        reason: isExplicit ? 'explicit_content' : null,
        scores
      };
    } catch (err) {
      console.error('[Moderation] classify failed, allowing upload:', err);
      // Model errors (CORS, memory, etc.) should not block legitimate uploads
      return { safe: true, reason: 'moderation_unavailable', scores: {} };
    }
  }
};

// Start pre-loading the model shortly after page loads
// so it's warm by the time the user picks an image
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof nsfwjs !== 'undefined') {
      Moderation.loadModel();
    }
  }, 1500);
});
