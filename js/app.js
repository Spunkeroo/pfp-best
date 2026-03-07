// Main App Logic for pfp.best

// Current chain filter state
let currentChainFilter = 'all';

// Toast notification system
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Build a PFP card as a real DOM element — safe for base64 imageUrls
function makePfpCardEl(pfp, rank) {
  const card = document.createElement('div');
  card.className = 'pfp-card';
  card.dataset.id = pfp.id;
  card.dataset.pfpId = pfp.id;
  card.dataset.chain = pfp.chain || '';

  const rating = (pfp.ratingAvg || 0).toFixed(1);
  const chain = pfp.chain || '';
  const safeTitle = escapeHtml(pfp.title || 'Untitled PFP');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'pfp-card-image';
  imgWrap.onclick = () => openPfpModal(pfp.id);

  const img = document.createElement('img');
  img.alt = safeTitle;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onerror = function() { this.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=' + pfp.id; };
  img.src = pfp.imageUrl;
  imgWrap.appendChild(img);

  if (pfp.category) {
    const badge = document.createElement('span');
    badge.className = 'pfp-card-badge';
    badge.textContent = pfp.category;
    imgWrap.appendChild(badge);
  }
  if (chain) {
    const cb = document.createElement('span');
    cb.className = `pfp-card-chain chain-${chain.toLowerCase()}`;
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

// Render PFP card HTML (kept for modal/other uses)
function renderPfpCard(pfp, rank) {
  const rating = (pfp.ratingAvg || 0).toFixed(1);
  const chain = pfp.chain || '';
  const safeChain = escapeHtml(chain);
  const chainBadge = chain ? `<span class="pfp-card-chain chain-${escapeHtml(chain.toLowerCase())}">${safeChain}</span>` : '';
  const safeTitle = (pfp.title || 'PFP').replace(/'/g, "\\'").replace(/"/g, '&quot;');

  return `
    <div class="pfp-card" data-id="${pfp.id}">
      <div class="pfp-card-image" onclick="openPfpModal('${pfp.id}')">
        <img src="${pfp.imageUrl}" alt="${safeTitle}" loading="lazy" onerror="this.src='https://api.dicebear.com/7.x/shapes/svg?seed=${pfp.id}'">
        ${pfp.category ? `<span class="pfp-card-badge">${escapeHtml(pfp.category)}</span>` : ''}
        ${chainBadge}
        ${rank ? `<span class="pfp-card-rank">${rank}</span>` : ''}
      </div>
      <div class="pfp-card-info">
        <div class="pfp-card-title" onclick="openPfpModal('${pfp.id}')" style="cursor:pointer">${escapeHtml(pfp.title || 'Untitled PFP')}</div>
        <div class="pfp-card-meta">
          <div class="pfp-card-rating">
            <span class="star-display">★</span>
            <span class="rating-value">${rating}</span>
          </div>
          <div class="pfp-card-votes">
            <span class="vote-up" onclick="event.stopPropagation(); quickVote('${pfp.id}', 'up')" title="Upvote">▲ ${pfp.upvotes || 0}</span>
            <span class="vote-down" onclick="event.stopPropagation(); quickVote('${pfp.id}', 'down')" title="Downvote">▼ ${pfp.downvotes || 0}</span>
          </div>
        </div>
        <div class="pfp-card-share">
          <button onclick="event.stopPropagation(); shareToX('${pfp.id}', '${safeTitle}', ${rating})" title="Share on X">𝕏 Share</button>
          <button onclick="event.stopPropagation(); copyPfpLink('${pfp.id}')" title="Copy Link">🔗 Copy</button>
        </div>
      </div>
    </div>
  `;
}

// Quick vote from card — updates count in-place after voting
async function quickVote(pfpId, type) {
  try {
    await votePfp(pfpId, type);
    // Re-read the updated PFP data and refresh the vote counts on all matching cards
    const snap = await pfpsRef.child(pfpId).once('value');
    const pfp = snap.val();
    if (pfp) {
      // Update inline onclick cards
      document.querySelectorAll(`[onclick*="quickVote('${pfpId}', 'up')"]`).forEach(el => {
        el.textContent = '\u25B2 ' + (pfp.upvotes || 0);
      });
      document.querySelectorAll(`[onclick*="quickVote('${pfpId}', 'down')"]`).forEach(el => {
        el.textContent = '\u25BC ' + (pfp.downvotes || 0);
      });
      // Update DOM-created cards (data-pfp-id attribute)
      document.querySelectorAll(`[data-pfp-id="${pfpId}"] .vote-up`).forEach(el => {
        el.textContent = '\u25B2 ' + (pfp.upvotes || 0);
      });
      document.querySelectorAll(`[data-pfp-id="${pfpId}"] .vote-down`).forEach(el => {
        el.textContent = '\u25BC ' + (pfp.downvotes || 0);
      });
    }
    showToast(type === 'up' ? 'Upvoted! \u25B2' : 'Downvoted! \u25BC', 'success');
  } catch (err) {
    showToast('Vote failed', 'error');
  }
}

// Chain filter for trending grid
function filterChain(chain, btn) {
  currentChainFilter = chain;
  document.querySelectorAll('.chain-tab,.leaderboard-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadTrendingByChain(chain);
}

// Category filter for browse chips
function filterCategory(category, btn) {
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active-chip'));
  if (btn) btn.classList.add('active-chip');
  if (!category || category === 'all') {
    loadTrendingByChain(currentChainFilter);
  } else {
    loadCategoryPfps(category);
  }
}

// Load trending PFPs filtered by blockchain
async function loadTrendingByChain(chain) {
  const grid = document.getElementById('trending-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div> Loading...</div>';
  try {
    const pfps = await fetchPfps('score', 150);
    let filtered = chain === 'all' ? pfps : pfps.filter(p => p.chain === chain);
    // Sort by actual user ratings (ratingAvg), then by combined score as tiebreaker
    filtered.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.score || 0) - (a.score || 0));
    filtered = filtered.slice(0, 50);
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">🎨</span><p>No PFPs found. Upload yours!</p></div>';
      return;
    }
    grid.innerHTML = '';
    filtered.forEach((pfp, i) => grid.appendChild(makePfpCardEl(pfp, i + 1)));
  } catch (err) {
    console.error('Load failed:', err);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Failed to load. Refresh to try again.</p></div>';
  }
}

// Share helpers
function shareToX(pfpId, title, rating) {
  const text = encodeURIComponent(`${title} rated ${rating}/10 on pfp.best 🔥\n\nRate yours → https://pfp.best/#pfp/${pfpId}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
}

function copyPfpLink(pfpId) {
  navigator.clipboard.writeText(`https://pfp.best/#pfp/${pfpId}`).then(() => showToast('Link copied!', 'success'));
}

// PFP Detail Modal
async function openPfpModal(pfpId) {
  const modal = document.getElementById('pfp-modal');
  if (!modal) return;

  const pfp = await fetchPfp(pfpId);
  if (!pfp) {
    showToast('PFP not found', 'error');
    return;
  }

  const comments = await getComments(pfpId);
  const rating = (pfp.ratingAvg || 0).toFixed(1);
  const chain = pfp.chain || '';
  const chainLabel = chain
    ? `<span class="pfp-card-chain chain-${escapeHtml(chain.toLowerCase())}" style="position:static;display:inline-block;margin-right:6px;">${escapeHtml(chain)}</span>`
    : '';

  const modalBody = modal.querySelector('.modal-body');

  // Build HTML with NO inline event handlers — wire up listeners below
  modalBody.innerHTML = `
    <div class="modal-pfp-image">
      <img id="modal-pfp-img" alt="${escapeHtml(pfp.title || 'PFP')}">
    </div>
    <h3 style="text-align:center;margin-bottom:8px;">${escapeHtml(pfp.title || 'Untitled PFP')}</h3>
    <p style="text-align:center;color:var(--muted);margin-bottom:20px;font-size:0.85rem;">
      ${chainLabel}${escapeHtml(pfp.category || 'other')} · <span id="modal-rating-count">${pfp.ratingCount || 0}</span> ratings · ${(pfp.upvotes || 0) - (pfp.downvotes || 0)} net votes
    </p>
    <div class="rating-stars" id="modal-stars">
      ${[1,2,3,4,5,6,7,8,9,10].map(i => `<span class="star" data-rating="${i}">★</span>`).join('')}
    </div>
    <div class="rating-avg">Average: <strong id="modal-rating-avg">${rating}/10</strong></div>
    <div class="vote-buttons">
      <button class="vote-btn vote-btn-up" id="modal-vote-up">▲ Upvote <span id="modal-upvotes">${pfp.upvotes || 0}</span></button>
      <button class="vote-btn vote-btn-down" id="modal-vote-down">▼ Downvote <span id="modal-downvotes">${pfp.downvotes || 0}</span></button>
    </div>
    <div class="comments-section">
      <h4>Roasts & Comments (<span id="modal-comment-count">${comments.length}</span>)</h4>
      <div class="comment-input-wrap">
        <input type="text" id="comment-input" placeholder="Drop a roast or comment..." maxlength="280">
        <button id="comment-submit">Post</button>
      </div>
      <div class="comment-list" id="comment-list">
        ${comments.map(c => `<div class="comment-item">${escapeHtml(c.text)}<div class="comment-time">${timeAgo(c.timestamp)}</div></div>`).join('')}
        ${comments.length === 0 ? '<p style="color:var(--muted);text-align:center;padding:16px;">No comments yet. Be the first to roast!</p>' : ''}
      </div>
    </div>
    ${typeof AIRater !== 'undefined' ? `<div class="ai-rate-section" id="ai-rate-${pfpId}"><button class="ai-rate-btn" id="ai-rate-btn">🤖 Get AI Rating</button></div>` : ''}
    <div class="share-buttons">
      <button class="share-btn share-btn-x" id="modal-share-x">𝕏 Share on X</button>
      <button class="share-btn share-btn-copy" id="modal-share-copy">📋 Copy Link</button>
    </div>
  `;

  // Set image src directly — never put base64 in innerHTML
  const modalImg = document.getElementById('modal-pfp-img');
  if (modalImg) {
    modalImg.src = pfp.imageUrl;
    modalImg.onerror = function() { this.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=' + pfpId; };
  }

  // Wire up all event listeners — no inline onclick
  modalBody.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => submitRating(pfpId, parseInt(star.dataset.rating, 10)));
  });

  const voteUp = document.getElementById('modal-vote-up');
  if (voteUp) voteUp.addEventListener('click', () => modalVote(pfpId, 'up'));

  const voteDown = document.getElementById('modal-vote-down');
  if (voteDown) voteDown.addEventListener('click', () => modalVote(pfpId, 'down'));

  const commentInput = document.getElementById('comment-input');
  const commentSubmit = document.getElementById('comment-submit');
  if (commentInput) commentInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(pfpId); });
  if (commentSubmit) commentSubmit.addEventListener('click', () => submitComment(pfpId));

  const shareX = document.getElementById('modal-share-x');
  if (shareX) shareX.addEventListener('click', () => ShareCard.shareToX(pfp));

  const shareCopy = document.getElementById('modal-share-copy');
  if (shareCopy) shareCopy.addEventListener('click', () => ShareCard.copyLink(pfpId));

  const aiBtn = document.getElementById('ai-rate-btn');
  if (aiBtn) aiBtn.addEventListener('click', () => runAiRating(pfpId, pfp.chain || 'Art'));

  window.currentModalPfp = pfp;
  modal.classList.add('active');
  history.pushState(null, '', `#pfp/${pfpId}`);
}

function closeModal() {
  const modal = document.getElementById('pfp-modal');
  if (modal) modal.classList.remove('active');
  history.pushState(null, '', window.location.pathname);
}

async function submitRating(pfpId, rating) {
  // Highlight stars immediately for visual feedback
  document.querySelectorAll('#modal-stars .star').forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
  try {
    await ratePfp(pfpId, rating);
    // Update displayed average optimistically
    const pfp = window.currentModalPfp;
    if (pfp) {
      const newCount = (pfp.ratingCount || 0) + 1;
      const newSum = (pfp.ratingSum || 0) + rating;
      const newAvg = (newSum / newCount).toFixed(1);
      const avgEl = document.getElementById('modal-rating-avg');
      if (avgEl) avgEl.textContent = `${newAvg}/10`;
      const countEl = document.getElementById('modal-rating-count');
      if (countEl) countEl.textContent = newCount;
      pfp.ratingSum = newSum;
      pfp.ratingCount = newCount;
      pfp.ratingAvg = parseFloat(newAvg);
    }
    showToast(`Rated ${rating}/10! ⭐`, 'success');
  } catch (err) {
    showToast('Rating failed — try again', 'error');
  }
}

async function modalVote(pfpId, type) {
  try {
    await votePfp(pfpId, type);
    showToast(type === 'up' ? 'Upvoted! ▲' : 'Downvoted! ▼', 'success');
    openPfpModal(pfpId);
  } catch (err) {
    showToast('Vote failed', 'error');
  }
}

async function submitComment(pfpId) {
  const input = document.getElementById('comment-input');
  if (!input || !input.value.trim()) return;

  try {
    const comment = await addComment(pfpId, input.value.trim());
    input.value = '';
    const list = document.getElementById('comment-list');
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `${escapeHtml(comment.text)}<div class="comment-time">just now</div>`;
    list.prepend(item);
    showToast('Comment posted!', 'success');
  } catch (err) {
    showToast('Failed to post comment', 'error');
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Time ago helper
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Handle URL hash for direct PFP links
function handleHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#pfp/')) {
    const pfpId = hash.replace('#pfp/', '');
    openPfpModal(pfpId);
  }
}

// Mobile menu toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.classList.toggle('open');
}

// Homepage: Load trending PFPs
async function loadTrending() {
  await loadTrendingByChain(currentChainFilter);
}

// Homepage: Load newest user uploads (seed images excluded)
async function loadNewestPfps() {
  const container = document.getElementById('newest-grid');
  if (!container) return;

  try {
    const all = await fetchPfps('uploadedAt', 200);
    // Filter out seeded images — show only real user uploads
    const pfps = all.filter(p => !p.uploadedBy || !p.uploadedBy.startsWith('seed_')).slice(0, 20);
    if (pfps.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">📸</span><p>Be the first to upload a PFP!</p></div>';
      return;
    }
    container.innerHTML = '';
    pfps.forEach(pfp => container.appendChild(makePfpCardEl(pfp, null)));
  } catch (err) {
    console.error('Failed to load newest:', err);
  }
}

// Homepage: Load PFP of the Day (highest score overall)
async function loadPfpOfDay() {
  const container = document.getElementById('pfp-of-day');
  if (!container) return;

  try {
    // Get top scoring PFP overall
    const pfps = await fetchPfps('score', 5);
    const pfp = pfps[0];
    if (!pfp) {
      container.style.display = 'none';
      return;
    }

    const rating = (pfp.ratingAvg || 0).toFixed(1);
    const chain = pfp.chain || '';
    const chainBadge = chain ? `<span class="pfp-card-chain chain-${chain.toLowerCase()}" style="position:static;display:inline-block;margin-right:8px;">${chain}</span>` : '';

    container.innerHTML = `
      <div class="section-header">
        <h2>🏆 PFP of the Day</h2>
      </div>
      <div class="pfp-of-day-card" onclick="openPfpModal('${pfp.id}')" style="cursor:pointer">
        <div class="pfp-of-day-image">
          <img src="${pfp.imageUrl}" alt="${pfp.title || 'PFP of the Day'}" onerror="this.src='https://api.dicebear.com/7.x/shapes/svg?seed=${pfp.id}'">
        </div>
        <div class="pfp-of-day-info">
          <span class="pfp-of-day-label">PFP OF THE DAY</span>
          <h3>${chainBadge}${pfp.title || 'Untitled PFP'}</h3>
          <div class="rating-display">★ ${rating}/10 · ${pfp.ratingCount || 0} ratings</div>
          <p class="top-comment">${pfp.commentCount || 0} roasts and counting...</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Failed to load PFP of the day:', err);
  }
}

// Category page: Load PFPs by category
async function loadCategoryPfps(category) {
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div> Loading...</div>';

  try {
    const cat = (!category || category === 'all') ? null : category;
    const pfps = await fetchPfps('score', 50, cat);
    if (pfps.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <span class="empty-icon">🖼️</span>
          <p>No ${category || ''} PFPs yet. Upload one!</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = '';
    pfps.forEach((pfp, i) => grid.appendChild(makePfpCardEl(pfp, i + 1)));
  } catch (err) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><p>Failed to load. Refresh to try again.</p></div>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Wire up modal close button and overlay click — no inline onclick needed
  const pfpModal = document.getElementById('pfp-modal');
  const closeBtnEl = document.getElementById('modal-close-btn');
  if (closeBtnEl) closeBtnEl.addEventListener('click', closeModal);
  if (pfpModal) pfpModal.addEventListener('click', e => { if (e.target === pfpModal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  loadTrending();
  loadPfpOfDay();
  loadNewestPfps();

  handleHash();
  window.addEventListener('hashchange', handleHash);

  // Auto-refresh every 10 seconds (respects current chain filter)
  setInterval(() => {
    loadTrendingByChain(currentChainFilter);
  }, 10000);
});
