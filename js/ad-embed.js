// ad-embed.js — SpunkArt Network Ad System
// Include this script on any site. Add <div data-ad-slot="banner|card|sticky"> where you want ads.
// Uses the shared Firebase project (predict-network-ec767) read-only via REST.

(function() {
  'use strict';

  const DB_URL = 'https://predict-network-ec767-default-rtdb.firebaseio.com/ads_manager/ads.json';
  const HOSTNAME = window.location.hostname.replace(/^www\./, '');

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const CSS = `
    .sa-ad { box-sizing: border-box; font-family: 'Inter', 'Segoe UI', sans-serif; }
    .sa-ad * { box-sizing: border-box; }
    .sa-ad a { text-decoration: none; display: block; }

    /* Banner — full-width horizontal strip */
    .sa-banner {
      width: 100%; padding: 14px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      border-radius: 12px; overflow: hidden;
    }
    .sa-banner-text { flex: 1; min-width: 0; }
    .sa-banner-headline {
      font-size: 1rem; font-weight: 700; line-height: 1.2;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sa-banner-desc {
      font-size: 0.82rem; margin-top: 2px; opacity: 0.85;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sa-banner-img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .sa-banner-cta {
      padding: 8px 18px; border-radius: 8px; font-size: 0.82rem; font-weight: 700;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
      white-space: nowrap; flex-shrink: 0;
    }
    .sa-banner-cta:hover { background: rgba(255,255,255,0.3); }

    /* Card — square-ish promo card */
    .sa-card {
      border-radius: 16px; overflow: hidden; width: 100%;
    }
    .sa-card-img { width: 100%; height: 140px; object-fit: cover; display: block; }
    .sa-card-body { padding: 14px 16px; }
    .sa-card-headline { font-size: 1rem; font-weight: 700; line-height: 1.3; }
    .sa-card-desc { font-size: 0.82rem; margin-top: 4px; opacity: 0.85; }
    .sa-card-cta {
      display: inline-block; margin-top: 12px; padding: 8px 18px;
      border-radius: 8px; font-size: 0.82rem; font-weight: 700;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
    }
    .sa-card-cta:hover { background: rgba(255,255,255,0.3); }

    /* Sticky — fixed bottom bar */
    .sa-sticky-wrap {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
    }
    .sa-sticky {
      width: 100%; padding: 10px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .sa-sticky-text { flex: 1; min-width: 0; }
    .sa-sticky-headline {
      font-size: 0.92rem; font-weight: 700;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sa-sticky-desc {
      font-size: 0.78rem; opacity: 0.85;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sa-sticky-cta {
      padding: 7px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 700;
      background: rgba(255,255,255,0.2); flex-shrink: 0;
    }
    .sa-sticky-cta:hover { background: rgba(255,255,255,0.3); }
    .sa-sticky-close {
      background: none; border: none; cursor: pointer; opacity: 0.7; font-size: 1.1rem;
      flex-shrink: 0; line-height: 1; padding: 4px;
    }
    .sa-sticky-close:hover { opacity: 1; }
    .sa-label {
      font-size: 0.6rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
      opacity: 0.45; margin-bottom: 2px; display: block;
    }

    @media (max-width: 500px) {
      .sa-banner-desc, .sa-sticky-desc { display: none; }
      .sa-banner-img { display: none; }
    }
  `;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('sa-ad-css')) return;
    const style = document.createElement('style');
    style.id = 'sa-ad-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str || '');
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Validate URL — only allow http(s)
  function safeUrl(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '#';
      return u.href;
    } catch { return '#'; }
  }

  // Track impression/click via Firebase REST (fire-and-forget)
  function trackEvent(adId, event) {
    const base = 'https://predict-network-ec767-default-rtdb.firebaseio.com/ads_manager/ads/' + adId;
    const field = event === 'click' ? 'clicks' : 'impressions';

    // Read current value then increment (no auth needed for public writes if rules allow)
    fetch(base + '/' + field + '.json')
      .then(r => r.json())
      .then(val => {
        return fetch(base + '/' + field + '.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify((val || 0) + 1)
        });
      })
      .catch(() => {});
  }

  // ── Ad renderers ─────────────────────────────────────────────────────────────
  function renderBanner(ad) {
    const url = safeUrl(ad.link || '#');
    const img = ad.imageUrl ? `<img class="sa-banner-img" src="${escapeAttr(ad.imageUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '';
    const el = document.createElement('div');
    el.className = 'sa-ad';
    el.innerHTML = `
      <a href="${escapeAttr(url)}" target="_blank" rel="noopener sponsored" class="sa-banner"
         style="background:${escapeAttr(ad.bgColor || '#1a1a2e')}; color:${escapeAttr(ad.textColor || '#f0f0f0')};"
         data-ad-id="${escapeAttr(ad.id)}">
        <span class="sa-label">Sponsored</span>
        ${img}
        <div class="sa-banner-text">
          <div class="sa-banner-headline">${escapeHtml(ad.headline)}</div>
          ${ad.description ? `<div class="sa-banner-desc">${escapeHtml(ad.description)}</div>` : ''}
        </div>
        ${ad.ctaText ? `<span class="sa-banner-cta">${escapeHtml(ad.ctaText)}</span>` : ''}
      </a>`;
    el.querySelector('a').addEventListener('click', () => trackEvent(ad.id, 'click'));
    return el;
  }

  function renderCard(ad) {
    const url = safeUrl(ad.link || '#');
    const el = document.createElement('div');
    el.className = 'sa-ad';
    el.innerHTML = `
      <a href="${escapeAttr(url)}" target="_blank" rel="noopener sponsored" class="sa-card"
         style="background:${escapeAttr(ad.bgColor || '#1a1a2e')}; color:${escapeAttr(ad.textColor || '#f0f0f0')};"
         data-ad-id="${escapeAttr(ad.id)}">
        ${ad.imageUrl ? `<img class="sa-card-img" src="${escapeAttr(ad.imageUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="sa-card-body">
          <span class="sa-label">Sponsored</span>
          <div class="sa-card-headline">${escapeHtml(ad.headline)}</div>
          ${ad.description ? `<div class="sa-card-desc">${escapeHtml(ad.description)}</div>` : ''}
          ${ad.ctaText ? `<span class="sa-card-cta">${escapeHtml(ad.ctaText)}</span>` : ''}
        </div>
      </a>`;
    el.querySelector('a').addEventListener('click', () => trackEvent(ad.id, 'click'));
    return el;
  }

  function renderSticky(ad) {
    const url = safeUrl(ad.link || '#');
    const wrap = document.createElement('div');
    wrap.className = 'sa-sticky-wrap';
    wrap.innerHTML = `
      <div class="sa-sticky" style="background:${escapeAttr(ad.bgColor || '#1a1a2e')}; color:${escapeAttr(ad.textColor || '#f0f0f0')};">
        <div class="sa-sticky-text">
          <span class="sa-label">Sponsored</span>
          <div class="sa-sticky-headline">${escapeHtml(ad.headline)}</div>
          ${ad.description ? `<div class="sa-sticky-desc">${escapeHtml(ad.description)}</div>` : ''}
        </div>
        ${ad.ctaText ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener sponsored" class="sa-sticky-cta" data-ad-id="${escapeAttr(ad.id)}">${escapeHtml(ad.ctaText)}</a>` : ''}
        <button class="sa-sticky-close" aria-label="Close ad">✕</button>
      </div>`;
    const cta = wrap.querySelector('.sa-sticky-cta');
    if (cta) cta.addEventListener('click', () => trackEvent(ad.id, 'click'));
    wrap.querySelector('.sa-sticky-close').addEventListener('click', () => wrap.remove());
    return wrap;
  }

  // ── Core: fetch ads and fill slots ───────────────────────────────────────────
  async function loadAds() {
    let ads;
    try {
      const res = await fetch(DB_URL + '?orderBy="enabled"&equalTo=true', {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;
      ads = Object.values(data);
    } catch { return; }

    const now = Date.now();

    // Filter to enabled ads targeting this hostname (or "all")
    const eligible = ads.filter(ad => {
      if (!ad || !ad.enabled) return false;
      if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
      if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
      if (!ad.sites || ad.sites.includes('all') || ad.sites.includes(HOSTNAME)) return true;
      return false;
    });

    if (eligible.length === 0) return;

    // Bucket by type
    const byType = { banner: [], card: [], sticky: [] };
    eligible.forEach(ad => {
      const t = ad.type || 'banner';
      if (byType[t]) byType[t].push(ad);
    });

    function pickRandom(arr) {
      return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
    }

    injectCSS();

    // Fill each slot element
    const slots = document.querySelectorAll('[data-ad-slot]');
    slots.forEach(slot => {
      const type = slot.getAttribute('data-ad-slot');
      const pool = byType[type] || [];
      const ad = pickRandom(pool);
      if (!ad) return;

      let el;
      if (type === 'banner') el = renderBanner(ad);
      else if (type === 'card') el = renderCard(ad);
      // sticky is handled separately below
      if (el) {
        slot.appendChild(el);
        trackEvent(ad.id, 'impression');
      }
    });

    // Sticky bar — injected once into body regardless of slot element
    const stickySlot = document.querySelector('[data-ad-slot="sticky"]');
    if (stickySlot) {
      const ad = pickRandom(byType.sticky);
      if (ad) {
        const el = renderSticky(ad);
        document.body.appendChild(el);
        trackEvent(ad.id, 'impression');
        stickySlot.style.display = 'none'; // hide placeholder
      }
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAds);
  } else {
    loadAds();
  }
})();
