// Share Card Generator for pfp.best

const ShareCard = {
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('share-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'share-canvas';
      this.canvas.style.display = 'none';
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
  },

  async generate(pfp, topComment) {
    if (!this.ctx) this.init();

    const width = 600;
    const height = 400;
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.ctx;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Neon border
    ctx.strokeStyle = '#bf5af2';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Inner glow line
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Load and draw PFP image
    try {
      const img = await this.loadImage(pfp.imageUrl);
      const imgSize = 160;
      const imgX = 40;
      const imgY = (height - imgSize) / 2;

      // Image border glow
      ctx.shadowColor = '#bf5af2';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#bf5af2';
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX - 2, imgY - 2, imgSize + 4, imgSize + 4);
      ctx.shadowBlur = 0;

      // Clip and draw image
      ctx.save();
      ctx.beginPath();
      ctx.rect(imgX, imgY, imgSize, imgSize);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      ctx.restore();
    } catch (e) {
      // Draw placeholder
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(40, 120, 160, 160);
      ctx.fillStyle = '#6b6b80';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🖼️', 120, 210);
    }

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0f0f0';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    const title = (pfp.title || 'Untitled PFP').slice(0, 30);
    ctx.fillText(title, 230, 100);

    // Category badge
    ctx.fillStyle = 'rgba(191, 90, 242, 0.2)';
    const catText = pfp.category || 'other';
    const catWidth = ctx.measureText(catText).width + 20;
    ctx.beginPath();
    ctx.roundRect(230, 110, catWidth, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#bf5af2';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(catText.toUpperCase(), 240, 129);

    // Rating
    const rating = (pfp.ratingAvg || 0).toFixed(1);
    ctx.fillStyle = '#fee440';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`★ ${rating}`, 230, 185);

    ctx.fillStyle = '#a0a0b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${pfp.ratingCount || 0} ratings · ${pfp.upvotes || 0} upvotes`, 230, 210);

    // Top comment/roast
    if (topComment) {
      ctx.fillStyle = '#6b6b80';
      ctx.font = 'italic 14px sans-serif';
      const commentText = `"${topComment.slice(0, 60)}${topComment.length > 60 ? '...' : ''}"`;
      ctx.fillText(commentText, 230, 250);
    }

    // Watermark
    ctx.fillStyle = 'rgba(191, 90, 242, 0.6)';
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('pfp.best', width - 30, height - 30);

    // Tagline
    ctx.fillStyle = 'rgba(0, 245, 212, 0.4)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Rate My PFP', width - 30, height - 50);

    ctx.textAlign = 'left';

    return this.canvas.toDataURL('image/png');
  },

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  },

  async shareToX(pfp, topComment) {
    const rating = (pfp.ratingAvg || 0).toFixed(1);
    const text = `My PFP got rated ${rating}/10 on pfp.best! 🔥\n\n${topComment ? `Top roast: "${topComment.slice(0, 80)}"\n\n` : ''}Rate yours 👉 pfp.best/#pfp/${pfp.id}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
  },

  copyDiscordEmbed(pfp) {
    const rating = (pfp.ratingAvg || 0).toFixed(1);
    const text = `**My PFP got rated ${rating}/10!** ⭐\nRate yours: https://pfp.best/#pfp/${pfp.id}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied for Discord!', 'success');
    });
  },

  copyLink(pfpId) {
    const url = `https://pfp.best/#pfp/${pfpId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied!', 'success');
    });
  },

  async download(pfp, topComment) {
    const dataUrl = await this.generate(pfp, topComment);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pfp-rating-${pfp.id}.png`;
    a.click();
  }
};
