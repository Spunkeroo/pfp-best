// Leaderboard Logic for pfp.best

const Leaderboard = {
  currentTab: 'top-rated',
  currentCategory: 'all',

  init() {
    this.bindTabs();
    this.bindFilters();
    this.load();
  },

  bindTabs() {
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
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
        case 'top-rated':
          orderBy = 'ratingAvg';
          break;
        case 'most-roasted':
          orderBy = 'commentCount';
          break;
        case 'rising':
          orderBy = 'uploadedAt';
          break;
        case 'controversial':
          orderBy = 'downvotes';
          break;
        default:
          orderBy = 'score';
      }

      const category = this.currentCategory !== 'all' ? this.currentCategory : null;
      let pfps = await fetchPfps(orderBy, 40, category);

      // For "most roasted" sort by comment count + downvotes
      if (this.currentTab === 'most-roasted') {
        pfps.sort((a, b) => ((b.commentCount || 0) + (b.downvotes || 0)) - ((a.commentCount || 0) + (a.downvotes || 0)));
      }

      if (pfps.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🖼️</span>
            <p>No PFPs yet. Be the first to upload!</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = pfps.map((pfp, i) => renderPfpCard(pfp, i + 1)).join('');
      bindCardClicks();
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      grid.innerHTML = '<div class="empty-state"><p>Failed to load. Please refresh.</p></div>';
    }
  }
};

// Initialize on page load if leaderboard exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('leaderboard-grid')) {
    Leaderboard.init();
  }
});
