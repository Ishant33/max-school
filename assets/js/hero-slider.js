/* ==========================================================================
   Full-bleed campus slideshow on the homepage.

   The nine photographs in index.html are the fallback: the first one carries
   .is-active, so if this script never runs — or PHP is unavailable, or no hero
   slides have been added in the CMS — the section still shows a photograph
   rather than an empty box.

   When the CMS has published hero slides they replace the fallback set. The
   dots are always generated here so their count can never drift from the
   number of slides actually on screen.

   Two sources feed the same strip — the localStorage cache and the CMS fetch —
   so every swap is numbered. Only the newest list may install itself, and a
   list already on screen is never rebuilt. Without that the two sources race,
   and the loser can leave `slides` pointing at elements the winner has already
   removed from the document, which stops the slideshow dead.
   ========================================================================== */

(() => {
  'use strict';

  const slider = document.querySelector('.hero-slider');
  if (!slider) return;

  // One slideshow per section. A duplicated <script> tag would otherwise attach
  // a second timer and a second set of listeners to the same photographs.
  if (slider.dataset.sliderReady === '1') return;
  slider.dataset.sliderReady = '1';

  const wrap = slider.querySelector('.slides');
  const dotsWrap = slider.querySelector('.slider-dots');
  if (!wrap) return;

  const FEED = 'backend/cms_list.php?module=hero';
  const CACHE_KEY = 'maxHeroSlides';
  const INTERVAL = 3000;
  // A new set is handed over once its first photograph has decoded. If the
  // network stalls we hand over anyway rather than stranding the visitor on the
  // old set — the <img> paints itself whenever it does arrive.
  const DECODE_TIMEOUT = 4000;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The photographs index.html ships with. Held as a reference, not just in the
  // DOM, so that deleting every slide in the CMS can put them back.
  const fallback = Array.from(wrap.querySelectorAll('.slide'));

  let slides = fallback.slice();
  let dots = [];
  let index = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
  let timer = null;
  // Autoplay has two independent holds — pointer and keyboard. Tracked apart so
  // a mouseleave cannot resume a slideshow that is still holding focus.
  let hovering = false;
  let focused = false;
  // Numbers each swap. A set that finishes decoding after a newer one has
  // started is discarded instead of overwriting it.
  let generation = 0;
  // What is on screen, and what is on screen *or in flight*. Comparing against
  // `wanted` makes the second source a no-op when it carries the same list,
  // which is the usual case: no rebuild, no flicker, no competing swap.
  let signature = '';
  let wanted = '';

  /* ---- painting ---------------------------------------------------------- */

  // A photograph that failed to load, or that an editor has hidden through the
  // Site Photos screen, would hold an empty navy frame for its whole turn.
  const paintable = (slide) => !slide.hidden && !(slide.complete && slide.naturalWidth === 0);

  // First paintable slide from `from`, moving in `dir`. Falls back to `from` so
  // a set where nothing can be painted still resolves to a valid index.
  const step = (from, dir) => {
    const total = slides.length;
    for (let i = 1; i <= total; i++) {
      const candidate = (((from + dir * i) % total) + total) % total;
      if (paintable(slides[candidate])) return candidate;
    }
    return from;
  };

  const show = (next, dir = 1) => {
    if (!slides.length) return;
    let target = (((next % slides.length) + slides.length) % slides.length);
    if (!paintable(slides[target])) target = step(target, dir);

    index = target;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    // Everything after the first slide loads lazily; warm the next one up so the
    // crossfade never lands on a half-decoded image.
    const upcoming = slides[step(index, dir)];
    if (upcoming && upcoming.loading === 'lazy') upcoming.loading = 'eager';
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const play = () => {
    stop();
    if (hovering || focused || reducedMotion.matches || document.hidden) return;
    if (slides.length < 2) return;
    timer = window.setInterval(() => show(index + 1), INTERVAL);
  };

  // Restart the clock after a manual jump so the new slide gets its full turn.
  const goTo = (next, dir = 1) => {
    show(next, dir);
    play();
  };

  // Rebuilt whenever the slide list changes, so the dot count always matches.
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    dots = slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Photo ${i + 1}`);
      dot.setAttribute('aria-current', String(i === index));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      return dot;
    });
    // A single photo is not a slideshow — nothing to navigate between.
    slider.classList.toggle('is-ready', slides.length > 1);
  }

  /* ---- CMS slides -------------------------------------------------------- */

  function buildSlide(item, first) {
    const img = document.createElement('img');
    img.className = 'slide';
    img.src = item.image_url;
    img.alt = item.title || '';
    img.decoding = 'async';
    if (first) {
      img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
    }
    return img;
  }

  // Identifies a list by what a visitor would actually see. An empty list is the
  // shipped set, whose signature is '' — so "no CMS slides" and "back to the
  // shipped photos" compare equal and no pointless swap happens.
  const signatureOf = (list) => list
    .map((item) => `${item.image_url}|${item.title || ''}`)
    .join('\n');

  // Resolves once the photograph is usable, false if it is broken. Never hangs:
  // a stalled network resolves on the timeout instead.
  function ready(img) {
    if (img.complete) return Promise.resolve(img.naturalWidth > 0);
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      img.addEventListener('load', () => done(true), { once: true });
      img.addEventListener('error', () => done(false), { once: true });
      window.setTimeout(() => done(img.naturalWidth > 0), DECODE_TIMEOUT);
    });
  }

  // Put `list` on screen. An empty list restores the photographs index.html
  // ships with, which is what a CMS with every slide deleted should show.
  async function applySlides(list) {
    const next = signatureOf(list);
    if (next === wanted) return;
    wanted = next;

    const restoring = list.length === 0;
    const fresh = restoring ? fallback.slice() : list.map((item, i) => buildSlide(item, i === 0));
    if (!fresh.length) {
      wanted = signature;
      return;
    }

    const mine = ++generation;

    // Behind the current photograph at opacity 0, so the browser starts
    // fetching while the old set is still the one on screen.
    fresh.forEach((img) => {
      img.classList.remove('is-active');
      wrap.appendChild(img);
    });

    // The shipped photographs have already been decoded once; only a new set
    // from the CMS is worth waiting for.
    const ok = restoring || await ready(fresh[0]);

    if (mine !== generation) {
      // A newer list started while this one was decoding. It owns `wanted`.
      fresh.forEach((img) => img.remove());
      return;
    }
    if (!ok) {
      // Broken URL — keep what is on screen rather than fading to nothing, and
      // leave the list retryable on the next load.
      fresh.forEach((img) => img.remove());
      wanted = signature;
      return;
    }

    const outgoing = Array.from(wrap.querySelectorAll('.slide'))
      .filter((img) => !fresh.includes(img));

    slides = fresh;
    signature = next;
    index = 0;
    buildDots();
    show(0);
    outgoing.forEach((img) => img.remove());
    play();
  }

  const usable = (items) => (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item.image_url === 'string' && item.image_url.trim() !== '');

  // Repeat visits apply the cached list straight away, so the CMS photographs
  // are what the visitor sees first rather than what they see second.
  try {
    const cached = window.localStorage && localStorage.getItem(CACHE_KEY);
    if (cached) {
      const list = usable(JSON.parse(cached));
      if (list.length) applySlides(list);
    }
  } catch (e) { /* private mode or a stale value — the fetch below still runs */ }

  // no-store: an editor who deletes a slide must not keep seeing it because the
  // browser held on to the previous feed.
  fetch(FEED, { credentials: 'same-origin', cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((items) => {
      // A missing endpoint must not wipe the slides the cache just applied.
      if (items === null) return;
      const list = usable(items);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch (e) { /* storage blocked — this visit still uses the fresh list */ }
      applySlides(list);
    })
    .catch(() => {
      // No PHP, offline, or the endpoint is missing: keep the shipped photos.
    });

  /* ---- controls ---------------------------------------------------------- */

  buildDots();

  slider.querySelector('.slider-arrow.prev')?.addEventListener('click', () => goTo(index - 1, -1));
  slider.querySelector('.slider-arrow.next')?.addEventListener('click', () => goTo(index + 1, 1));

  // Left/right arrow keys work once any control inside the slider has focus.
  slider.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index - 1, -1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index + 1, 1); }
  });

  slider.addEventListener('mouseenter', () => { hovering = true; stop(); });
  slider.addEventListener('mouseleave', () => { hovering = false; play(); });

  // The section itself is the "Skip to main content" target, so it takes focus
  // on any visit to index.html#main-content. That is not keyboard navigation of
  // the slideshow and must not hold autoplay — only the controls inside do.
  slider.addEventListener('focusin', (event) => {
    if (event.target === slider) return;
    focused = true;
    stop();
  });
  slider.addEventListener('focusout', (event) => {
    if (event.target === slider) return;
    focused = false;
    play();
  });

  // Horizontal swipe on touch devices, where the arrows are small.
  let touchX = null;
  slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 45) goTo(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });

  // No point burning a timer while the tab is in the background.
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  reducedMotion.addEventListener('change', () => play());

  // Leaving the page drops the timer; coming back — including a Back button
  // restore from the bfcache, where the old timer is frozen rather than
  // cleared — starts a single fresh one. The pointer may well have left the
  // slider while the page was away, so that hold is released too.
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', () => {
    hovering = false;
    play();
  });

  play();
})();
