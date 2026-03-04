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

// Render PFP card HTML
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

// Quick vote from card
async function quickVote(pfpId, type) {
  try {
    await votePfp(pfpId, type);
    showToast(type === 'up' ? 'Upvoted! ▲' : 'Downvoted! ▼', 'success');
  } catch (err) {
    showToast('Vote failed', 'error');
  }
}

// Chain filter for trending grid
function filterChain(chain, btn) {
  currentChainFilter = chain;
  document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadTrendingByChain(chain);
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
    grid.innerHTML = filtered.map((pfp, i) => renderPfpCard(pfp, i + 1)).join('');
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
  const safeModalChain = escapeHtml(chain);
  const chainLabel = chain ? `<span class="pfp-card-chain chain-${escapeHtml(chain.toLowerCase())}" style="position:static;display:inline-block;margin-right:6px;">${safeModalChain}</span>` : '';

  const modalBody = modal.querySelector('.modal-body');
  modalBody.innerHTML = `
    <div class="modal-pfp-image">
      <img src="${pfp.imageUrl}" alt="${escapeHtml(pfp.title || 'PFP')}" onerror="this.src='https://api.dicebear.com/7.x/shapes/svg?seed=${pfpId}'">
    </div>

    <h3 style="text-align:center; margin-bottom:8px;">${escapeHtml(pfp.title || 'Untitled PFP')}</h3>
    <p style="text-align:center; color:var(--text-muted); margin-bottom:20px; font-size:0.85rem;">
      ${chainLabel} ${escapeHtml(pfp.category || 'other')} · ${pfp.ratingCount || 0} ratings · ${(pfp.upvotes || 0) - (pfp.downvotes || 0)} net votes
    </p>

    <div class="rating-stars" id="modal-stars">
      ${[1,2,3,4,5,6,7,8,9,10].map(i => `<span class="star" data-rating="${i}" onclick="submitRating('${pfpId}', ${i})">★</span>`).join('')}
    </div>
    <div class="rating-avg">Average: <strong>${rating}/10</strong></div>

    <div class="vote-buttons">
      <button class="vote-btn vote-btn-up" onclick="modalVote('${pfpId}', 'up')">
        ▲ Upvote <span id="modal-upvotes">${pfp.upvotes || 0}</span>
      </button>
      <button class="vote-btn vote-btn-down" onclick="modalVote('${pfpId}', 'down')">
        ▼ Downvote <span id="modal-downvotes">${pfp.downvotes || 0}</span>
      </button>
    </div>

    <div class="comments-section">
      <h4>Roasts & Comments (${comments.length})</h4>
      <div class="comment-input-wrap">
        <input type="text" id="comment-input" placeholder="Drop a roast or comment..." maxlength="280" onkeydown="if(event.key==='Enter')submitComment('${pfpId}')">
        <button onclick="submitComment('${pfpId}')">Post</button>
      </div>
      <div class="comment-list" id="comment-list">
        ${comments.map(c => `
          <div class="comment-item">
            ${escapeHtml(c.text)}
            <div class="comment-time">${timeAgo(c.timestamp)}</div>
          </div>
        `).join('')}
        ${comments.length === 0 ? '<p style="color:var(--text-muted); text-align:center; padding:16px;">No comments yet. Be the first to roast!</p>' : ''}
      </div>
    </div>

    ${typeof AIRater !== 'undefined' ? renderAiRaterButton(pfpId, pfp.chain || 'Art') : ''}

    <div class="share-buttons">
      <button class="share-btn share-btn-x" onclick="ShareCard.shareToX(currentModalPfp)">
        𝕏 Share on X
      </button>
      <button class="share-btn share-btn-copy" onclick="ShareCard.copyLink('${pfpId}')">
        📋 Copy Link
      </button>
    </div>
  `;

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
  try {
    await ratePfp(pfpId, rating);
    document.querySelectorAll('#modal-stars .star').forEach((star, i) => {
      star.classList.toggle('active', i < rating);
    });
    showToast(`Rated ${rating}/10!`, 'success');
  } catch (err) {
    showToast('Rating failed', 'error');
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

// Homepage: Load newest user uploads
async function loadNewestPfps() {
  const container = document.getElementById('newest-grid');
  if (!container) return;

  try {
    const pfps = await fetchPfps('uploadedAt', 8);
    if (pfps.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">📸</span><p>Be the first to upload a PFP!</p></div>';
      return;
    }
    // Newest first (fetchPfps already reverses, so latest are first)
    container.innerHTML = pfps.map(pfp => renderPfpCard(pfp, null)).join('');
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
    grid.innerHTML = pfps.map((pfp, i) => renderPfpCard(pfp, i + 1)).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><p>Failed to load. Refresh to try again.</p></div>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
