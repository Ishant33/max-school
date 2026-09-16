/* ==========================================================================
   Site Photos — CMS screen

   Lists every photograph the website ships with, grouped by what it is, and
   lets each one be replaced, hidden or restored. Replacing never overwrites the
   original file in assets/img — the upload lands in backend/uploads/site/ and a
   small map records the swap, so "Restore original" always works.

   This screen manages photos that already exist; there is deliberately no way
   to add one here. A photo appears because a page references it or because the
   file sits in assets/img, so "add" means putting it on a page.

   Whether a photo is on the site and which file it uses are tracked separately,
   so hiding a replaced photo and showing it again brings the replacement back
   rather than silently reverting to the original.

   Exposed as window.SiteImages.render(mount, helpers); admin.js calls this when
   the Site Photos module is selected. Helpers (api/post/toast/esc/setBusy) are
   passed in so this file carries no fetch or escaping logic of its own.
   ========================================================================== */

(() => {
  'use strict';

  const ENDPOINT = 'media_admin.php';

  let H = null;          // helpers from admin.js
  let mount = null;
  let items = [];
  let groups = {};
  let filter = 'all';

  const el = (html) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  };

  // Cache-bust thumbnails: a replacement keeps the same catalogue path, so
  // without this the panel would keep showing the photo it just replaced.
  let cacheKey = '0';
  const bust = (url) => url + (url.includes('?') ? '&' : '?') + 'v=' + cacheKey;

  const kb = (bytes) => {
    if (!bytes) return '';
    return bytes >= 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  };

  /* ---- load -------------------------------------------------------------- */

  async function render(mountNode, helpers) {
    mount = mountNode;
    H = helpers;
    mount.className = 'media-screen';
    mount.innerHTML = '<div class="loading-state">Loading photos…</div>';
    await load();
  }

  async function load() {
    try {
      const json = await H.api(`${ENDPOINT}?action=list`);
      if (!json.ok) throw new Error(json.message || 'Could not load the photo list');
      items = json.data || [];
      groups = json.groups || {};
      cacheKey = String(Date.now());
      paint();
    } catch (error) {
      mount.innerHTML = `<div class="empty-state">
                <strong>Could not load photos</strong>
                ${H.esc(error.message)}
            </div>`;
    }
  }

  /* ---- paint ------------------------------------------------------------- */

  function paint() {
    mount.innerHTML = '';
    mount.appendChild(buildToolbar());

    const visible = items.filter(matchesFilter);
    if (!visible.length) {
      mount.appendChild(el(`<div class="empty-state">
                <strong>Nothing to show</strong>
                No photos match this filter.
            </div>`));
      return;
    }

    Object.entries(groups).forEach(([key, label]) => {
      const inGroup = visible.filter((item) => item.group === key);
      if (!inGroup.length) return;

      mount.appendChild(el(`<h4 class="media-group">${H.esc(label)}
                <span>${inGroup.length}</span></h4>`));

      const grid = el('<div class="media-grid"></div>');
      inGroup.forEach((item) => grid.appendChild(buildCard(item)));
      mount.appendChild(grid);
    });
  }

  function matchesFilter(item) {
    if (filter === 'changed') return item.replaced || item.hidden;
    if (filter === 'hidden') return item.hidden;
    if (filter === 'unused') return !item.used;
    return true;
  }

  function buildToolbar() {
    const changed = items.filter((item) => item.replaced || item.hidden).length;
    const hidden = items.filter((item) => item.hidden).length;
    const bar = el(`<div class="media-toolbar">
            <div class="media-filters">
                <button type="button" class="btn btn-ghost btn-sm" data-filter="all">All photos (${items.length})</button>
                <button type="button" class="btn btn-ghost btn-sm" data-filter="changed">Changed (${changed})</button>
                <button type="button" class="btn btn-ghost btn-sm" data-filter="hidden">Hidden (${hidden})</button>
                <button type="button" class="btn btn-ghost btn-sm" data-filter="unused">Not on any page</button>
            </div>
            <p class="media-note">Replacing a photo swaps it everywhere it appears.
               The original file is kept, so you can always restore it. Hiding takes a
               photo off the site without deleting anything.</p>
        </div>`);

    bar.querySelectorAll('[data-filter]').forEach((button) => {
      button.classList.toggle('is-on', button.dataset.filter === filter);
      button.addEventListener('click', () => {
        filter = button.dataset.filter;
        paint();
      });
    });
    return bar;
  }

  function buildCard(item) {
    const pages = item.pages.length
      ? item.pages.map((page) => `<span class="media-page">${H.esc(page)}</span>`).join('')
      : '<span class="media-page media-page-none">Not used on any page</span>';

    const size = item.width && item.height
      ? `${item.width} × ${item.height}`
      : (item.exists ? 'Size unknown' : 'File missing');

    const state = item.hidden
      ? (item.replaced
        ? '<span class="tag tag-draft">Hidden on the site</span><span class="tag tag-featured">Replaced</span>'
        : '<span class="tag tag-draft">Hidden on the site</span>')
      : (item.replaced ? '<span class="tag tag-featured">Replaced</span>' : '');

    // A hero-sized photo below ~1200px wide will look soft edge to edge, which
    // is worth saying here rather than letting it be discovered on the site.
    const soft = item.width && item.width < 1200 && item.group === 'campus'
      ? `<span class="media-warn">Low resolution for full-width use</span>`
      : '';

    // Whether the photo is on the site and which file it uses are separate
    // things, so each button undoes exactly one of them. Replace works in
    // either state and leaves the other alone.
    const showHide = item.group === 'brand'
      ? ''
      : `<button type="button" class="btn ${item.hidden ? 'btn-secondary' : 'btn-ghost'} btn-sm" data-visibility>
            ${item.hidden ? 'Show on site' : 'Hide from site'}</button>`;

    const restore = item.replaced
      ? '<button type="button" class="btn btn-ghost btn-sm" data-reset>Restore original</button>'
      : '';

    const card = el(`<article class="media-card${item.hidden ? ' is-hidden' : ''}">
            <div class="media-thumb">
                ${item.exists || item.replaced
        ? `<img src="${H.esc(bust(item.current_url))}" alt="" loading="lazy">`
        : '<div class="media-thumb-missing">Missing</div>'}
                ${item.hidden ? '<span class="media-hidden-flag">Hidden</span>' : ''}
            </div>
            <div class="media-info">
                <h5>${H.esc(item.label)}</h5>
                <code class="media-path">${H.esc(item.path)}</code>
                <div class="media-meta">
                    <span>${H.esc(size)}</span>
                    ${item.bytes ? `<span>${H.esc(kb(item.bytes))}</span>` : ''}
                    ${state}
                    ${soft}
                </div>
                <div class="media-pages">${pages}</div>
            </div>
            <div class="media-actions">
                <label class="btn btn-secondary btn-sm media-upload">
                    <span class="btn-text">${item.replaced ? 'Change photo' : 'Replace'}</span>
                    <span class="btn-spinner" hidden>●●●</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden>
                </label>
                ${showHide}
                ${restore}
            </div>
        </article>`);

    wireCard(card, item);
    return card;
  }

  /* ---- actions ----------------------------------------------------------- */

  function wireCard(card, item) {
    const uploadLabel = card.querySelector('.media-upload');
    const input = uploadLabel.querySelector('input[type="file"]');

    // Keep the control usable on browsers that do not dispatch a click from a
    // label containing a hidden input (some embedded/admin webviews do this).
    uploadLabel.addEventListener('click', (event) => {
      if (event.target === uploadLabel || event.target.closest('.btn-text')) {
        event.preventDefault();
        input.click();
      }
    });

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;

      H.setBusy(uploadLabel, true);
      // A <label> is not a form control, so setBusy's disabled flag does nothing
      // here — block the click surface explicitly.
      uploadLabel.classList.add('is-busy');
      try {
        const fd = new FormData();
        fd.append('action', 'replace');
        fd.append('path', item.path);
        fd.append('file', file);
        const json = await H.post(ENDPOINT, fd);
        if (!json.ok) throw new Error(json.message || 'Could not replace the photo');
        // Say so when the swap will not be visible yet, otherwise the panel
        // looks like it ignored the upload.
        H.toast(json.hidden
          ? 'Photo replaced — still hidden, press Show on site to use it'
          : 'Photo replaced');
        await load();
      } catch (error) {
        H.toast(error.message, 'error');
      } finally {
        H.setBusy(uploadLabel, false);
        uploadLabel.classList.remove('is-busy');
        input.value = '';
      }
    });

    card.querySelector('[data-visibility]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      H.setBusy(button, true);
      try {
        const json = await H.post(ENDPOINT, {
          // Two actions, not one toggle: the server decides nothing about intent,
          // so a stale card can never hide a photo that someone else just hid.
          action: item.hidden ? 'show' : 'hide',
          path: item.path,
        });
        if (!json.ok) throw new Error(json.message || 'Could not update the photo');
        H.toast(item.hidden
          ? (item.replaced ? 'Photo shown again, with its replacement' : 'Photo shown again')
          : 'Photo hidden from the site');
        await load();
      } catch (error) {
        H.setBusy(button, false);
        H.toast(error.message, 'error');
      }
    });

    card.querySelector('[data-reset]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      H.setBusy(button, true);
      try {
        const json = await H.post(ENDPOINT, { action: 'reset', path: item.path });
        if (!json.ok) throw new Error(json.message || 'Could not restore the photo');
        H.toast(json.hidden
          ? 'Original photo restored — still hidden from the site'
          : 'Original photo restored');
        await load();
      } catch (error) {
        H.setBusy(button, false);
        H.toast(error.message, 'error');
      }
    });
  }

  window.SiteImages = { render };
})();
