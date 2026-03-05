// Leaderboard Logic for pfp.best

// Build a card as a real DOM element — avoids dumping base64 into innerHTML
function makeLeaderboardCard(pfp, rank) {
  const card = document.createElement('div');
  card.className = 'pfp-card';
  card.dataset.id = pfp.id;

  const rating = (pfp.ratingAvg || 0).toFixed(1);
  const chain = pfp.chain || '';
  const safeTitle = escapeHtml(pfp.title || 'Untitled PFP');

  // Image wrapper
  const imgWrap = document.createElement('div');
  imgWrap.className = 'pfp-card-image';
  imgWrap.onclick = () => openPfpModal(pfp.id);

  const img = document.createElement('img');
  img.alt = safeTitle;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onerror = function() { this.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=' + pfp.id; };
  img.src = pfp.imageUrl; // set directly — never parsed as HTML
  imgWrap.appendChild(img);

  if (pfp.category) {
    const badge = document.createElement('span');
    badge.className = 'pfp-card-badge';
    badge.textContent = pfp.category;
    imgWrap.appendChild(badge);
  }

  if (chain) {
    const chainColors = { BTC: '#ff9900', ETH: '#6370ff', SOL: '#9945ff', art: '#00f5d4' };
    const cb = document.createElement('span');
    cb.className = 'pfp-card-chain chain-' + chain.toLowerCase();
    cb.textContent = chain;
    imgWrap.appendChild(cb);
  }

  if (rank) {
    const rankEl = document.createElement('span');
    rankEl.className = 'pfp-card-rank';
    rankEl.textContent = rank;
    imgWrap.appendChild(rankEl);
  }

  card.appendChild(imgWrap);

  // Info section via innerHTML (no base64 here — safe)
  const info = document.createElement('div');
  info.className = 'pfp-card-info';
  info.innerHTML = `
    <div class="pfp-card-title" style="cursor:pointer">${safeTitle}</div>
    <div class="pfp-card-meta">
      <div class="pfp-card-rating"><span class="star-display">★</span><span class="rating-value">${rating}</span></div>
      <div class="pfp-card-votes">
        <span class="vote-up" title="Upvote">▲ ${pfp.upvotes || 0}</span>
        <span class="vote-down" title="Downvote">▼ ${pfp.downvotes || 0}</span>
      </div>
    </div>
    <div class="pfp-card-share">
      <button title="Share on X">𝕏 Share</button>
      <button title="Copy Link">🔗 Copy</button>
    </div>
  `;

  info.querySelector('.pfp-card-title').onclick = () => openPfpModal(pfp.id);
  info.querySelector('.vote-up').onclick = e => { e.stopPropagation(); quickVote(pfp.id, 'up'); };
  info.querySelector('.vote-down').onclick = e => { e.stopPropagation(); quickVote(pfp.id, 'down'); };
  info.querySelectorAll('.pfp-card-share button')[0].onclick = e => { e.stopPropagation(); shareToX(pfp.id, pfp.title || 'PFP', rating); };
  info.querySelectorAll('.pfp-card-share button')[1].onclick = e => { e.stopPropagation(); copyPfpLink(pfp.id); };

  card.appendChild(info);
  return card;
}

const Leaderboard = {
  currentTab: 'top-rated',
  currentCategory: 'all',
  currentChain: 'all',

  init() {
    this.bindTabs();
    this.bindChainTabs();
    this.bindFilters();
    this.load();
  },

  bindTabs() {
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.load();
      });
    });
  },

  bindChainTabs() {
    document.querySelectorAll('[data-chain]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-chain]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentChain = tab.dataset.chain;
        this.load();
      });
    });
  },

  bindFilters() {
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.currentCategory = categoryFilter.value;
        this.load();
      });
    }
  },

  async load() {
    const grid = document.getElementById('leaderboard-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div> Loading PFPs...</div>';

    try {
      let orderBy;
      switch (this.currentTab) {
        case 'top-rated':    orderBy = 'ratingAvg';    break;
        case 'most-roasted': orderBy = 'commentCount'; break;
        case 'rising':       orderBy = 'uploadedAt';   break;
        case 'controversial':orderBy = 'downvotes';    break;
        default:             orderBy = 'score';
      }

      const category = this.currentCategory !== 'all' ? this.currentCategory : null;
      let pfps = await fetchPfps(orderBy, 150, category);

      // Filter by chain
      if (this.currentChain !== 'all') {
        pfps = pfps.filter(p => p.chain === this.currentChain);
      }

      // Sort
      if (this.currentTab === 'top-rated') {
        pfps.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));
      } else if (this.currentTab === 'most-roasted') {
        pfps.sort((a, b) => ((b.commentCount || 0) + (b.downvotes || 0)) - ((a.commentCount || 0) + (a.downvotes || 0)));
      }

      pfps = pfps.slice(0, 30);

      if (pfps.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">🖼️</span><p>No PFPs found. Be the first to upload!</p></div>';
        return;
      }

      // Render via DOM — no base64 in innerHTML
      grid.innerHTML = '';
      pfps.forEach((pfp, i) => grid.appendChild(makeLeaderboardCard(pfp, i + 1)));

    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Failed to load. Please refresh.</p></div>';
    }
  }
};

// Initialize on page load if leaderboard exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('leaderboard-grid')) {
    Leaderboard.init();
  }
});
