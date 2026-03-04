// AI PFP Rater — uses MobileNet for image analysis
// Generates an AI score (1-10) + a funny/insightful roast/review

const AIRater = (() => {
  let model = null;
  let loading = false;

  // Load MobileNet v2 (lightweight, runs in browser)
  async function loadModel() {
    if (model) return model;
    if (loading) {
      // Wait for ongoing load
      while (loading) await new Promise(r => setTimeout(r, 100));
      return model;
    }
    loading = true;
    try {
      // Use tf-models mobilenet via CDN — dynamically inject script if needed
      if (!window.mobilenet) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      model = await window.mobilenet.load({ version: 2, alpha: 0.5 });
    } finally {
      loading = false;
    }
    return model;
  }

  // Generate AI commentary based on top MobileNet predictions + image stats
  function generateRoast(predictions, imgEl, chainLabel) {
    const top = predictions[0]?.className?.toLowerCase() || '';
    const second = predictions[1]?.className?.toLowerCase() || '';
    const conf = ((predictions[0]?.probability || 0) * 100).toFixed(0);

    // Derive a score from confidence + entropy across predictions
    const entropy = predictions.reduce((sum, p) => {
      const pr = p.probability;
      return pr > 0 ? sum - pr * Math.log2(pr) : sum;
    }, 0);
    // Higher entropy = more abstract/interesting image = higher score
    const rawScore = Math.min(10, Math.max(4, 4 + entropy * 2.2 + (conf > 70 ? 1 : 0)));
    const score = parseFloat(rawScore.toFixed(1));

    // Build commentary
    const chain = chainLabel || 'your chain';
    const roasts = [];

    if (top.includes('mask') || top.includes('face') || top.includes('head')) {
      roasts.push(`Detected: face energy. The AI sees *you* in this one.`);
    } else if (top.includes('space') || top.includes('nebula') || top.includes('cosmic') || top.includes('universe')) {
      roasts.push(`Cosmic vibes detected. This PFP screams "I have strong opinions about DeFi."`);
    } else if (top.includes('animal') || top.includes('cat') || top.includes('dog') || top.includes('wolf') || top.includes('fox')) {
      roasts.push(`Animal energy confirmed. ${chain} holders love this aesthetic.`);
    } else if (top.includes('cartoon') || top.includes('comic') || top.includes('anime')) {
      roasts.push(`2D character detected — classic pfp energy. The chain knows.`);
    } else if (top.includes('robot') || top.includes('mech') || top.includes('machine')) {
      roasts.push(`Mechanical. Cold. Precise. Perfect for a ${chain} maxi.`);
    } else if (top.includes('art') || top.includes('paint') || top.includes('sketch') || top.includes('drawing')) {
      roasts.push(`Artistic. The kind of PFP that wins irl respect.`);
    } else if (conf > 80) {
      roasts.push(`AI is ${conf}% confident this is "${predictions[0]?.className}". Respectfully, serve.`);
    } else {
      roasts.push(`Mysterious. Even the AI is unsure — and that makes it hit harder.`);
    }

    // Score-based closing remark
    let verdict;
    if (score >= 8.5) verdict = `Top 1% energy. Share this immediately. 🔥`;
    else if (score >= 7) verdict = `Solid pfp — the community will respect it.`;
    else if (score >= 5.5) verdict = `Mid-tier potential. A little more edge and you're cooking.`;
    else verdict = `AI says: keep looking. The right pfp is out there.`;

    return { score, roast: roasts[0], verdict };
  }

  // Analyze an image element
  async function analyze(imgEl, chainLabel) {
    const net = await loadModel();

    // Classify with top 5 predictions
    const predictions = await net.classify(imgEl, 5);
    return generateRoast(predictions, imgEl, chainLabel);
  }

  return { analyze, loadModel };
})();


// ── UI helpers injected into the PFP modal ────────────────────────────────────

function renderAiRaterButton(pfpId, chain) {
  return `
    <div class="ai-rate-section" id="ai-rate-${pfpId}">
      <button class="ai-rate-btn" onclick="runAiRating('${pfpId}', '${escapeHtml(chain || 'Art')}')">
        🤖 Get AI Rating
      </button>
    </div>`;
}

async function runAiRating(pfpId, chain) {
  const section = document.getElementById(`ai-rate-${pfpId}`);
  if (!section) return;

  section.innerHTML = `<div class="ai-rate-loading"><div class="spinner" style="width:20px;height:20px;margin:0 auto 8px;"></div><div style="color:var(--text-muted);font-size:0.82rem;">AI is analyzing your PFP…</div></div>`;

  try {
    const img = document.querySelector('.modal-pfp-image img');
    if (!img) throw new Error('No image found');

    // Make sure image is loaded (may need crossOrigin)
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.src = img.src;
    await new Promise((res, rej) => {
      if (tempImg.complete) { res(); return; }
      tempImg.onload = res;
      tempImg.onerror = rej;
    });

    const { score, roast, verdict } = await AIRater.analyze(tempImg, chain);
    const scoreColor = score >= 8 ? 'var(--neon-cyan)' : score >= 6 ? 'var(--neon-purple)' : 'var(--neon-pink)';

    section.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <span class="ai-badge">🤖 AI SCORE</span>
          <span class="ai-score" style="color:${scoreColor}">${score}/10</span>
        </div>
        <p class="ai-roast">${escapeHtml(roast)}</p>
        <p class="ai-verdict">${escapeHtml(verdict)}</p>
        <button class="ai-share-btn" onclick="shareAiRating('${pfpId}', ${score})">𝕏 Share AI Rating</button>
      </div>`;
  } catch (err) {
    console.error('AI rating failed:', err);
    section.innerHTML = `<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:12px;">AI rating unavailable — rate it yourself above!</div>`;
  }
}

function shareAiRating(pfpId, score) {
  const text = encodeURIComponent(`The AI rated my PFP ${score}/10 on pfp.best 🤖🔥\n\nRate yours → https://pfp.best/#pfp/${pfpId}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
}
