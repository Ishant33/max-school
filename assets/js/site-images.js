/* ==========================================================================
   Site photos — applies the swaps made in the CMS "Site Photos" screen.

   The pages still ship with their original <img src>, so the site works with
   this script blocked, with PHP unavailable, or with an empty override map.
   Only photos an editor has actually changed are touched.

   Loaded synchronously from <head> on purpose. A cached copy of the map is
   applied through a MutationObserver as the parser creates each <img>, which
   for the lazy-loaded photos below the fold means the original file is never
   requested at all.
   ========================================================================== */

(() => {
  'use strict';

  const FEED = 'backend/media_list.php';
  const CACHE_KEY = 'maxSiteImages';

  // Wrappers that exist only to hold one photo plus its caption. When a photo
  // is hidden we hide the wrapper, otherwise the page keeps an empty tile with
  // a stray label under it.
  const TILE = [
    '.gallery-tile',
    '.infra-card',
    '.leader-card',
    '.about-imgrow > .ph',
  ].join(', ');

  /* ---- keys ------------------------------------------------------------- */

  // Must match media_key() in backend/media_catalog.php. The pages are not
  // consistent about spaces — index.html writes %20 where about-us.html writes
  // a literal space — so both decode to the same catalogue key.
  const normalise = (src) => {
    if (!src) return null;
    src = src.trim();
    if (src === '' || /^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return null;
    try {
      src = decodeURIComponent(src);
    } catch (e) {
      return null; // malformed escape — leave the image alone
    }
    src = src.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
    return src.includes('..') ? null : src;
  };

  const keyOf = (img) => img.getAttribute('data-img-key') || normalise(img.getAttribute('src'));

  /* ---- applying --------------------------------------------------------- */

  let map = {};

  function apply(img) {
    const key = keyOf(img);
    if (!key) return;

    const hasOverride = Object.prototype.hasOwnProperty.call(map, key);
    const changed = img.hasAttribute('data-img-key');

    if (!hasOverride) {
      // The override was removed in the CMS since the cached map was stored.
      if (changed) restore(img);
      return;
    }

    // Remember the original so a later map can undo this.
    if (!changed) {
      img.setAttribute('data-img-key', key);
      img.setAttribute('data-img-src', img.getAttribute('src') || '');
    }

    const replacement = map[key];
    if (replacement === null) {
      (img.closest(TILE) || img).hidden = true;
      return;
    }
    (img.closest(TILE) || img).hidden = false;
    if (img.getAttribute('src') !== replacement) {
      img.setAttribute('src', replacement);
    }
  }

  function restore(img) {
    const original = img.getAttribute('data-img-src');
    if (original !== null) img.setAttribute('src', original);
    (img.closest(TILE) || img).hidden = false;
    img.removeAttribute('data-img-key');
    img.removeAttribute('data-img-src');
  }

  function applyAll(root) {
    const scope = root || document;
    if (scope.tagName === 'IMG') { apply(scope); return; }
    if (!scope.querySelectorAll) return;
    scope.querySelectorAll('img').forEach(apply);
  }

  /* ---- cached map, applied during parsing -------------------------------- */

  try {
    const cached = window.localStorage && localStorage.getItem(CACHE_KEY);
    if (cached) map = JSON.parse(cached) || {};
  } catch (e) { /* private mode, or a stale value — fall through to the fetch */ }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) applyAll(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  /* ---- fresh map --------------------------------------------------------- */

  const paint = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyAll(), { once: true });
    } else {
      applyAll();
    }
  };

  fetch(FEED, { credentials: 'same-origin' })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (!json || !json.ok || typeof json.map !== 'object' || json.map === null) return;
      map = json.map;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(map));
      } catch (e) { /* storage full or blocked — the map still applies this visit */ }
      paint();
    })
    .catch(() => {
      // No PHP, offline, or the endpoint is missing: the pages keep the photos
      // they shipped with. Nothing to report to the visitor.
    });

  paint();
})();
