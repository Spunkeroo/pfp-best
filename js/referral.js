// Referral System for pfp.best
(function() {
  const fp = localStorage.getItem('pfp_fp') || (() => {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('pfp_fp', id);
    return id;
  })();

  // Display referral link
  function initReferral() {
    const urlEl = document.getElementById('referral-url');
    if (!urlEl) return;
    const ref = `${window.location.origin}${window.location.pathname}?ref=${fp}`;
    urlEl.value = ref;

    const copyBtn = document.getElementById('referral-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ref).then(() => {
          copyBtn.textContent = '✓ Copied!';
          setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
        }).catch(() => {});
      });
    }

    const shareBtn = document.getElementById('referral-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const text = encodeURIComponent(`Rate my PFP on pfp.best — the community rates, roasts & ranks profile pictures 🔥\n${ref}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
      });
    }
  }

  // Check for incoming referral
  function checkIncomingRef() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref !== fp) {
      localStorage.setItem('pfp_referred_by', ref);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReferral();
    checkIncomingRef();
  });
})();
