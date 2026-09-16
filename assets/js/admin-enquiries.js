/* ==========================================================================
   Enquiries — CMS screen

   Everything submitted through the contact-us form. Read-only apart from the
   read/unread flag and delete; backend/form_submit.php is the only writer.

   Exposed as window.Enquiries.render(mount, helpers); admin.js calls this when
   the Enquiries module is selected. Helpers (api/post/toast/esc/setBusy) are
   passed in so this file carries no fetch or escaping logic of its own.
   ========================================================================== */

(() => {
  'use strict';

  const ENDPOINT = 'enquiries_admin.php';

  let H = null;          // helpers from admin.js
  let mount = null;
  let rows = [];
  let counts = { total: 0, unread: 0 };
  let filter = 'all';
  let search = '';
  let searchTimer = null;

  const el = (html) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  };

  // "2026-08-24 15:04:22" -> "24 Aug 2026, 3:04 pm". Safari refuses to parse
  // that format, so the parts are read out rather than handed to Date().
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function when(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value || ''));
    if (!m) return value || '';
    const hour = Number(m[4]);
    const suffix = hour < 12 ? 'am' : 'pm';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}, ${hour12}:${m[5]} ${suffix}`;
  }

  /* ---- load -------------------------------------------------------------- */

  async function render(mountNode, helpers) {
    mount = mountNode;
    H = helpers;
    mount.className = 'enquiry-screen';
    mount.innerHTML = '<div class="loading-state">Loading enquiries…</div>';
    await load();
  }

  async function load() {
    try {
      const query = `?action=list&filter=${encodeURIComponent(filter)}`
        + `&q=${encodeURIComponent(search)}`;
      const json = await H.api(ENDPOINT + query);
      if (!json.ok) throw new Error(json.message || 'Could not load enquiries');
      rows = json.data || [];
      counts = { total: json.total || 0, unread: json.unread || 0 };
      if (H.setBadge) H.setBadge('enquiries', counts.unread);
      paint();
    } catch (error) {
      mount.innerHTML = `<div class="empty-state">
                <strong>Could not load enquiries</strong>
                ${H.esc(error.message)}
            </div>`;
    }
  }

  // Repaint the list without losing what has been typed in the search box.
  function reload({ keepFocus } = {}) {
    const hadFocus = keepFocus && document.activeElement === mount.querySelector('#enq-search');
    const caret = hadFocus ? document.activeElement.selectionStart : null;
    return load().then(() => {
      if (!hadFocus) return;
      const box = mount.querySelector('#enq-search');
      if (!box) return;
      box.focus();
      if (caret !== null) box.setSelectionRange(caret, caret);
    });
  }

  /* ---- paint ------------------------------------------------------------- */

  function paint() {
    mount.innerHTML = '';
    mount.appendChild(buildToolbar());

    if (!rows.length) {
      mount.appendChild(el(`<div class="empty-state">
                <strong>${counts.total ? 'No matching enquiries' : 'No enquiries yet'}</strong>
                ${counts.total
          ? 'Try a different search or filter.'
          : 'Messages sent through the Contact Us form will appear here.'}
            </div>`));
      return;
    }

    const list = el('<div class="enquiry-list"></div>');
    rows.forEach((row) => list.appendChild(buildCard(row)));
    mount.appendChild(list);
  }

  function buildToolbar() {
    const bar = el(`<div class="enquiry-toolbar">
            <div class="enquiry-filters">
                <button type="button" class="btn btn-ghost btn-sm" data-filter="all">All (${counts.total})</button>
                <button type="button" class="btn btn-ghost btn-sm" data-filter="unread">Unread (${counts.unread})</button>
            </div>
            <input type="search" id="enq-search" class="enquiry-search"
                   placeholder="Search name, phone, email or message"
                   value="${H.esc(search)}">
            <div class="enquiry-tools">
                <button type="button" class="btn btn-ghost btn-sm" data-read-all
                        ${counts.unread ? '' : 'disabled'}>
                    <span class="btn-text">Mark all read</span>
                    <span class="btn-spinner" hidden>●●●</span>
                </button>
                <a class="btn btn-secondary btn-sm" href="backend/${ENDPOINT}?action=export">Export CSV</a>
            </div>
        </div>`);

    bar.querySelectorAll('[data-filter]').forEach((button) => {
      button.classList.toggle('is-on', button.dataset.filter === filter);
      button.addEventListener('click', () => {
        filter = button.dataset.filter;
        load();
      });
    });

    const box = bar.querySelector('#enq-search');
    box.addEventListener('input', () => {
      // Debounced so a full-word search is one request, not one per keystroke.
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        search = box.value.trim();
        reload({ keepFocus: true });
      }, 280);
    });

    bar.querySelector('[data-read-all]').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      H.setBusy(button, true);
      try {
        const json = await H.post(ENDPOINT, { action: 'read_all' });
        if (!json.ok) throw new Error(json.message || 'Could not update');
        H.toast('All enquiries marked read');
        await load();
      } catch (error) {
        H.setBusy(button, false);
        H.toast(error.message, 'error');
      }
    });

    return bar;
  }

  function buildCard(row) {
    const phone = String(row.phone || '').replace(/[^\d+]/g, '');
    const card = el(`<article class="enquiry-card${row.is_read ? '' : ' is-unread'}" data-id="${row.id}">
            <div class="enquiry-head">
                <div>
                    <h5>${H.esc(row.name || 'Unnamed')}
                        ${row.is_read ? '' : '<span class="tag tag-featured">New</span>'}</h5>
                    <span class="enquiry-when">${H.esc(when(row.created))}</span>
                </div>
                <span class="tag tag-order">${H.esc(row.interest || 'General Enquiry')}</span>
            </div>
            <div class="enquiry-contact">
                ${row.phone ? `<a href="tel:${H.esc(phone)}">📞 ${H.esc(row.phone)}</a>` : ''}
                ${row.email ? `<a href="mailto:${H.esc(row.email)}">✉️ ${H.esc(row.email)}</a>` : ''}
                ${row.phone ? `<a href="https://wa.me/${H.esc(phone.replace(/^\+/, ''))}"
                    target="_blank" rel="noopener">WhatsApp ↗</a>` : ''}
            </div>
            ${row.message ? `<p class="enquiry-message">${H.esc(row.message).replace(/\n/g, '<br>')}</p>` : ''}
            <div class="enquiry-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-read>
                    <span class="btn-text">${row.is_read ? 'Mark unread' : 'Mark read'}</span>
                    <span class="btn-spinner" hidden>●●●</span>
                </button>
                <button type="button" class="btn btn-danger btn-sm" data-delete>Delete</button>
            </div>
        </article>`);

    card.querySelector('[data-read]').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      H.setBusy(button, true);
      try {
        const json = await H.post(ENDPOINT, {
          action: 'read',
          id: row.id,
          is_read: row.is_read ? '' : '1',
        });
        if (!json.ok) throw new Error(json.message || 'Could not update');
        await reload({ keepFocus: true });
      } catch (error) {
        H.setBusy(button, false);
        H.toast(error.message, 'error');
      }
    });

    card.querySelector('[data-delete]').addEventListener('click', (event) => {
      confirmDelete(card, event.currentTarget, row);
    });

    return card;
  }

  // Inline confirmation, matching the pattern used by the content screens.
  function confirmDelete(card, button, row) {
    const actions = button.parentElement;

    actions.innerHTML = `
            <span class="confirm-delete">Delete this enquiry?</span>
            <button type="button" class="btn btn-danger btn-sm" data-confirm>Yes</button>
            <button type="button" class="btn btn-ghost btn-sm" data-cancel>No</button>`;

    // Rebuild the card rather than restoring its markup, so its buttons come
    // back with their real handlers attached.
    actions.querySelector('[data-cancel]').addEventListener('click', () => {
      card.replaceWith(buildCard(row));
    });

    actions.querySelector('[data-confirm]').addEventListener('click', async (event) => {
      H.setBusy(event.currentTarget, true);
      try {
        const json = await H.post(ENDPOINT, { action: 'delete', id: row.id });
        if (!json.ok) throw new Error(json.message || 'Could not delete');
        card.style.transition = 'opacity .2s';
        card.style.opacity = '0';
        H.toast('Enquiry deleted');
        window.setTimeout(() => load(), 200);
      } catch (error) {
        H.setBusy(event.currentTarget, false);
        H.toast(error.message, 'error');
      }
    });
  }

  window.Enquiries = { render };
})();
