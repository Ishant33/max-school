/* ==========================================================================
   Max International School — CMS Dashboard
   ========================================================================== */

(() => {
    'use strict';

    const API = 'backend/';

    /* ----------------------------------------------------------------------
       Module registry — describes what each screen shows and which fields
       its editor exposes. Adding a module is a matter of adding an entry
       here plus a nav item in admin.html.
       ---------------------------------------------------------------------- */

    const MODULES = {
        hero: {
            label: 'Homepage Slideshow',
            description: 'Photos in the full-width slideshow at the top of the homepage. '
                + 'Display Order decides the sequence; the title is read out by screen readers.',
            fields: ['image'],
            titleLabel: 'Photo Description',
            bodyLabel: 'Internal Note (not shown on the site)',
        },
        images: {
            label: 'Site Photos',
            description: 'Replace, hide or restore any photo used across the website',
            custom: 'images',
        },
        enquiries: {
            label: 'Enquiries',
            description: 'Messages sent through the Contact Us form',
            custom: 'enquiries',
        },
        about: {
            label: 'About Us',
            description: 'Manage content blocks for the About Us page',
            fields: ['image'],
        },
        academics: {
            label: 'Academics',
            description: 'Manage programmes and academic content',
            fields: ['image'],
        },
        admission: {
            label: 'Admission',
            description: 'Manage admission steps, criteria and notices',
            fields: ['image'],
        },
        fees: {
            label: 'Fee Structure',
            description: 'Manage grade-wise fee schedule, scholarship details and fee prospectus PDF',
            custom: 'fees',
        },
        beyond: {
            label: 'Beyond Activities',
            description: 'Manage sports, arts and co-curricular activities',
            fields: ['image'],
        },
        promax: {
            label: 'Pro Max',
            description: 'Manage the Pro Max programme content',
            fields: ['image'],
        },
        career: {
            label: 'Career',
            description: 'Manage job openings and career listings',
            fields: ['image', 'badge'],
        },
        gallery: {
            label: 'Gallery',
            description: 'Manage photos and albums shown in the gallery',
            fields: ['image'],
        },
        newsletters: {
            label: 'E-Newsletter',
            description: 'Publish newsletters — the latest three appear on the homepage',
            fields: ['cover', 'link'],
            titleLabel: 'Newsletter Title',
        },
        notifications: {
            label: 'Notifications',
            description: 'Announcements shown on the site. Mark one as featured for the homepage banner.',
            fields: ['badge', 'featured', 'link'],
            titleLabel: 'Headline',
            bodyLabel: 'Message',
        },
        disclosure: {
            label: 'Mandatory Disclosure',
            description: 'Manage statutory disclosure information and documents',
            custom: 'disclosure',
        },
    };

    /* ----------------------------------------------------------------------
       Screens that manage their own markup instead of using the shared
       title/content editor. Each one lives in its own file and exposes
       window.<global>.render(mount, helpers).
       ---------------------------------------------------------------------- */

    const CUSTOM_SCREENS = {
        disclosure: { global: 'Disclosure', title: 'Disclosure Sections', loading: 'Loading disclosure data…' },
        fees: { global: 'FeeAdmin', title: 'Fee Structure Management', loading: 'Loading fee structure…' },
        images: { global: 'SiteImages', title: 'Photos Used on the Site', loading: 'Loading photos…' },
        enquiries: { global: 'Enquiries', title: 'Received Enquiries', loading: 'Loading enquiries…' },
    };

    /* ----------------------------------------------------------------------
       State + helpers
       ---------------------------------------------------------------------- */

    let currentModule = 'hero';
    let editingId = null;
    let items = [];

    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));

    const esc = value => String(value == null ? '' : value)
        .replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));

    function showAlert(selector, text) {
        const el = $(selector);
        if (!el) return;
        el.textContent = text || '';
        el.hidden = !text;
    }

    function toast(message, type = 'success') {
        const container = $('#toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
            el.style.transition = 'opacity .25s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 260);
        }, 3200);
    }

    function setBusy(button, busy) {
        if (!button) return;
        button.disabled = busy;
        const text = button.querySelector('.btn-text');
        const spinner = button.querySelector('.btn-spinner');
        if (text) text.hidden = busy;
        if (spinner) spinner.hidden = !busy;
    }

    // Every response is JSON; a non-JSON body means PHP emitted a warning
    // or the server returned an error page, so surface that rather than
    // failing with an opaque "Unexpected token" parse error.
    async function api(path, options = {}) {
        const res = await fetch(API + path, {
            credentials: 'same-origin',
            ...options,
        });
        const raw = await res.text();
        let json;
        try {
            json = JSON.parse(raw);
        } catch (e) {
            throw new Error(
                res.status === 404
                    ? 'Endpoint not found on the server — upload the backend/ folder.'
                    : `Server error (${res.status}). ${raw.slice(0, 160)}`
            );
        }
        if (!res.ok && json && json.message) throw new Error(json.message);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return json;
    }

    function post(path, data) {
        const fd = data instanceof FormData ? data : new FormData();
        if (!(data instanceof FormData)) {
            Object.entries(data || {}).forEach(([k, v]) => fd.append(k, v));
        }
        return api(path, { method: 'POST', body: fd });
    }

    /* ----------------------------------------------------------------------
       Session
       ---------------------------------------------------------------------- */

    async function checkSession() {
        try {
            const json = await api('session.php');
            if (json.logged) {
                enterDashboard(json.email || '');
            } else {
                showLogin();
            }
        } catch (error) {
            showLogin();
            showAlert('#login-error', 'Cannot reach the server: ' + error.message);
        }
    }

    function showLogin() {
        $('#dashboard-view').hidden = true;
        const login = $('#login-view');
        login.hidden = false;
        // Re-attach in case a previous session removed it from the DOM.
        if (!login.isConnected) document.body.prepend(login);
    }

    function enterDashboard(email) {
        // Remove the login screen from the DOM entirely so it cannot flash
        // back or be reached with the browser's back button.
        const login = $('#login-view');
        if (login) login.remove();

        $('#dashboard-view').hidden = false;
        $('#user-email').textContent = email;
        selectModule(currentModule);
        refreshEnquiryBadge();
    }

    /* ----------------------------------------------------------------------
       Module switching
       ---------------------------------------------------------------------- */

    function selectModule(key) {
        const config = MODULES[key];
        if (!config) return;

        currentModule = key;
        resetForm();

        $('#module-title').textContent = config.label;
        $('#module-description').textContent = config.description;

        $$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === key);
        });

        applyFieldVisibility(config);

        if (config.custom) {
            renderCustomScreen(config);
        } else {
            $('.editor-card').hidden = false;
            $('#list-title').textContent = 'Published Items';
            loadItems();
        }
    }

    function applyFieldVisibility(config) {
        const fields = config.fields || [];
        $('#image-fields').hidden = !fields.includes('image');
        $('#newsletter-fields').hidden = !fields.includes('link');
        $('#cover-field').hidden = !fields.includes('cover');
        $('#badge-field').hidden = !fields.includes('badge');
        $('#featured-field').hidden = !fields.includes('featured');

        const titleLabel = document.querySelector('label[for="item-title"]');
        if (titleLabel) titleLabel.textContent = (config.titleLabel || 'Title') + ' *';
        const bodyLabel = document.querySelector('label[for="item-body"]');
        if (bodyLabel) bodyLabel.textContent = config.bodyLabel || 'Content';
    }

    /* ----------------------------------------------------------------------
       Item list
       ---------------------------------------------------------------------- */

    async function loadItems() {
        const list = $('#items-list');
        // A custom screen may have left its own class here.
        list.className = 'items-grid';
        list.innerHTML = '<div class="loading-state">Loading items…</div>';

        try {
            const json = await api(`cms_admin.php?action=list&module=${encodeURIComponent(currentModule)}`);
            items = json.data || [];
            renderItems();
        } catch (error) {
            list.innerHTML = `<div class="empty-state"><strong>Could not load items</strong>${esc(error.message)}</div>`;
        }
    }

    function renderItems() {
        const list = $('#items-list');

        if (!items.length) {
            list.innerHTML = `<div class="empty-state">
                <strong>No items yet</strong>
                Use the form above to add your first item.
            </div>`;
            return;
        }

        // Swapping a photo is the commonest edit on a picture-led screen like the
        // homepage slideshow, so it gets its own control on the card instead of
        // being buried in the editor form.
        const hasImage = (MODULES[currentModule]?.fields || []).includes('image');

        list.innerHTML = items.map(item => {
            const thumb = item.cover_url || item.image_url;
            const thumbHtml = thumb
                ? `<img class="item-thumb" src="${esc(thumb)}" alt="" loading="lazy">`
                : `<div class="item-thumb-placeholder">${currentModule === 'newsletters' ? '📰' : currentModule === 'notifications' ? '🔔' : '📄'}</div>`;

            const tags = [
                item.is_published
                    ? '<span class="tag tag-published">Published</span>'
                    : '<span class="tag tag-draft">Draft</span>',
                item.is_featured ? '<span class="tag tag-featured">Homepage banner</span>' : '',
                item.badge ? `<span class="tag tag-featured">${esc(item.badge)}</span>` : '',
                `<span class="tag tag-order">Order ${Number(item.sort_order) || 0}</span>`,
                item.link_url
                    ? `<a class="tag tag-link" href="${esc(item.link_url)}" target="_blank" rel="noopener">Open link ↗</a>`
                    : '',
            ].filter(Boolean).join('');

            return `<article class="item-card" data-id="${item.id}">
                ${thumbHtml}
                <div class="item-content">
                    <h4 class="item-title">${esc(item.title)}</h4>
                    ${item.body ? `<p class="item-body">${esc(item.body)}</p>` : ''}
                    <div class="item-meta">${tags}</div>
                </div>
                <div class="item-actions">
                    ${hasImage ? `<label class="btn btn-secondary btn-sm media-upload" data-replace>
                        <span class="btn-text">${item.image_url ? 'Replace Photo' : 'Add Photo'}</span>
                        <span class="btn-spinner" hidden>●●●</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" hidden>
                    </label>` : ''}
                    <button class="btn btn-ghost btn-sm" data-edit="${item.id}">Edit</button>
                    <button class="btn btn-danger btn-sm" data-delete="${item.id}">Delete</button>
                </div>
            </article>`;
        }).join('');

        list.querySelectorAll('.item-actions').forEach(wireItemActions);
    }

    // Called for a freshly painted card and again after a cancelled delete puts
    // the original buttons back, so no action is ever left dead.
    function wireItemActions(actions) {
        const id = actions.closest('.item-card')?.dataset.id;

        actions.querySelector('[data-edit]')?.addEventListener('click', () => {
            const item = items.find(i => String(i.id) === id);
            if (item) startEdit(item);
        });

        actions.querySelector('[data-delete]')?.addEventListener('click', event => {
            confirmDelete(event.currentTarget);
        });

        const label = actions.querySelector('[data-replace]');
        label?.querySelector('input[type="file"]').addEventListener('change', () => {
            replaceItemImage(label, id);
        });
    }

    // Uploads a new photo and posts only that one field, so an item can be
    // re-photographed without its title, order or publish state being restated.
    async function replaceItemImage(label, id) {
        const input = label.querySelector('input[type="file"]');
        const file = input.files[0];
        if (!file) return;

        setBusy(label, true);
        // A <label> is not a form control, so setBusy's disabled flag does
        // nothing here — block the click surface explicitly.
        label.classList.add('is-busy');
        try {
            const imageUrl = await uploadFile(file, 'image');
            const json = await post('cms_admin.php', { action: 'update', id, image_url: imageUrl });
            if (!json.ok) throw new Error(json.message || 'Could not replace the photo');
            toast('Photo replaced');
            await loadItems();
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            setBusy(label, false);
            label.classList.remove('is-busy');
            input.value = '';
        }
    }

    // Inline confirmation — replaces the action buttons with Confirm/Cancel
    // instead of a browser confirm() dialog.
    function confirmDelete(button) {
        const card = button.closest('.item-card');
        const actions = button.parentElement;
        const original = actions.innerHTML;
        const id = button.dataset.delete;

        actions.innerHTML = `
            <span class="confirm-delete">Delete?</span>
            <button class="btn btn-danger btn-sm" data-confirm>Yes</button>
            <button class="btn btn-ghost btn-sm" data-cancel>No</button>`;

        actions.querySelector('[data-cancel]').addEventListener('click', () => {
            actions.innerHTML = original;
            wireItemActions(actions);
        });

        actions.querySelector('[data-confirm]').addEventListener('click', async e => {
            setBusy(e.currentTarget, true);
            try {
                await post('cms_admin.php', { action: 'delete', id });
                card.style.transition = 'opacity .2s';
                card.style.opacity = '0';
                setTimeout(() => {
                    items = items.filter(i => String(i.id) !== id);
                    renderItems();
                }, 200);
                toast('Item deleted');
                if (String(editingId) === id) resetForm();
            } catch (error) {
                setBusy(e.currentTarget, false);
                toast(error.message, 'error');
            }
        });
    }

    /* ----------------------------------------------------------------------
       Editor
       ---------------------------------------------------------------------- */

    function resetForm() {
        editingId = null;
        $('#content-form').reset();
        $('#item-published').checked = true;
        $('#item-sort').value = 0;
        $('#editor-title').textContent = 'Add Item';
        $('#cancel-edit-btn').hidden = true;
        $('#image-preview').hidden = true;
        $('#pdf-preview').hidden = true;
        showAlert('#editor-error', '');
    }

    function startEdit(item) {
        editingId = item.id;
        $('#edit-id').value = item.id;
        $('#item-title').value = item.title || '';
        $('#item-body').value = item.body || '';
        $('#item-image-url').value = item.image_url || '';
        $('#item-link-url').value = item.link_url || '';
        $('#item-cover-url').value = item.cover_url || '';
        $('#item-badge').value = item.badge || '';
        $('#item-sort').value = Number(item.sort_order) || 0;
        $('#item-published').checked = !!item.is_published;
        $('#item-featured').checked = !!item.is_featured;

        $('#editor-title').textContent = 'Edit Item';
        $('#cancel-edit-btn').hidden = false;
        showAlert('#editor-error', '');
        $('.editor-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function uploadFile(file, kind) {
        const fd = new FormData();
        fd.append('action', 'upload');
        fd.append('kind', kind);
        fd.append('file', file);
        const json = await api('cms_admin.php', { method: 'POST', body: fd });
        if (!json.ok) throw new Error(json.message || 'Upload failed');
        return json.url;
    }

    async function handleSave(event) {
        event.preventDefault();
        showAlert('#editor-error', '');

        const button = event.target.querySelector('button[type="submit"]');
        setBusy(button, true);

        try {
            const config = MODULES[currentModule] || {};
            const fields = config.fields || [];

            let imageUrl = $('#item-image-url').value.trim();
            let linkUrl = $('#item-link-url').value.trim();

            const imageFile = $('#item-image-file').files[0];
            if (imageFile && fields.includes('image')) {
                imageUrl = await uploadFile(imageFile, 'image');
            }

            const pdfFile = $('#item-pdf-file').files[0];
            if (pdfFile && fields.includes('link')) {
                linkUrl = await uploadFile(pdfFile, 'newsletter');
            }

            const fd = new FormData();
            fd.append('action', editingId ? 'update' : 'insert');
            if (editingId) fd.append('id', editingId);
            fd.append('module', currentModule);
            fd.append('title', $('#item-title').value.trim());
            fd.append('body', $('#item-body').value.trim());
            fd.append('image_url', imageUrl);
            fd.append('link_url', linkUrl);
            fd.append('cover_url', $('#item-cover-url').value.trim());
            fd.append('badge', $('#item-badge').value.trim());
            fd.append('sort_order', Number($('#item-sort').value) || 0);
            // Sent on every save, "1" or "0". The editor form is the one place
            // that owns the whole item, so it states both flags outright; the
            // per-item actions below send neither and leave them as they are.
            fd.append('is_published', $('#item-published').checked ? '1' : '0');
            if (fields.includes('featured')) {
                fd.append('is_featured', $('#item-featured').checked ? '1' : '0');
            }

            const json = await post('cms_admin.php', fd);
            if (!json.ok) throw new Error(json.message || 'Save failed');

            toast(editingId ? 'Item updated' : 'Item added');
            resetForm();
            loadItems();
        } catch (error) {
            showAlert('#editor-error', error.message);
            toast(error.message, 'error');
        } finally {
            setBusy(button, false);
        }
    }

    /* ----------------------------------------------------------------------
       File previews
       ---------------------------------------------------------------------- */

    function wirePreviews() {
        $('#item-image-file').addEventListener('change', event => {
            const file = event.target.files[0];
            const box = $('#image-preview');
            if (!file) { box.hidden = true; return; }
            const url = URL.createObjectURL(file);
            box.innerHTML = `<img src="${url}" alt=""><span class="preview-name">${esc(file.name)}</span>`;
            box.hidden = false;
        });

        $('#item-pdf-file').addEventListener('change', event => {
            const file = event.target.files[0];
            const box = $('#pdf-preview');
            if (!file) { box.hidden = true; return; }
            const size = (file.size / (1024 * 1024)).toFixed(1);
            box.innerHTML = `<span>📄</span><span class="preview-name">${esc(file.name)} — ${size} MB</span>`;
            box.hidden = false;
        });
    }

    /* ----------------------------------------------------------------------
       Custom screens — hand the list area over to the module's own file.
       ---------------------------------------------------------------------- */

    function renderCustomScreen(config) {
        const screen = CUSTOM_SCREENS[config.custom] || {};
        const list = $('#items-list');

        $('.editor-card').hidden = true;
        $('#list-title').textContent = screen.title || config.label;
        // Each screen sets its own class; reset first so switching between two
        // custom screens cannot leave the previous one's styling behind.
        list.className = 'items-grid';
        list.innerHTML = `<div class="loading-state">${esc(screen.loading || 'Loading…')}</div>`;

        const impl = window[screen.global];
        if (impl && typeof impl.render === 'function') {
            impl.render(list, { api, post, toast, esc, setBusy, setBadge });
        } else {
            list.innerHTML = `<div class="empty-state">
                <strong>${esc(config.label)}</strong>
                Could not load this screen module. Refresh the page and ensure
                the CMS JavaScript files are uploaded.
            </div>`;
        }
    }

    // Count bubble on a sidebar item — currently the unread enquiry count.
    function setBadge(moduleKey, count) {
        const item = $$('.nav-item').find(nav => nav.dataset.module === moduleKey);
        if (!item) return;
        let badge = item.querySelector('.nav-badge');
        if (!count) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'nav-badge';
            item.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : String(count);
    }

    // Unread enquiries are worth seeing without opening the screen first.
    async function refreshEnquiryBadge() {
        try {
            const json = await api('enquiries_admin.php?action=list&filter=unread');
            if (json.ok) setBadge('enquiries', Number(json.unread) || 0);
        } catch (error) { /* no PHP or no enquiries yet — leave the sidebar clean */ }
    }

    /* ----------------------------------------------------------------------
       Auth actions
       ---------------------------------------------------------------------- */

    function wireLogin() {
        $('#login-form').addEventListener('submit', async event => {
            event.preventDefault();
            showAlert('#login-error', '');
            const button = event.target.querySelector('button[type="submit"]');
            setBusy(button, true);

            try {
                const json = await post('login.php', {
                    email: $('#login-email').value.trim(),
                    password: $('#login-password').value,
                });
                if (!json.ok) throw new Error(json.message || 'Invalid email or password');
                enterDashboard(json.email || $('#login-email').value.trim());
            } catch (error) {
                showAlert('#login-error', error.message);
                setBusy(button, false);
            }
        });
    }

    function wireDashboardActions() {
        $('#sign-out-btn').addEventListener('click', async () => {
            try {
                await api('logout.php', { method: 'POST' });
            } catch (e) { /* sign out locally regardless */ }
            location.reload();
        });

        $$('.nav-item').forEach(item => {
            item.addEventListener('click', event => {
                event.preventDefault();
                selectModule(item.dataset.module);
            });
        });

        $('#content-form').addEventListener('submit', handleSave);
        $('#cancel-edit-btn').addEventListener('click', resetForm);
    }

    function wireChangePassword() {
        const modal = $('#change-password-modal');
        const open = () => {
            showAlert('#password-error', '');
            $('#change-password-form').reset();
            modal.hidden = false;
        };
        const close = () => { modal.hidden = true; };

        $('#change-password-btn').addEventListener('click', open);
        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.querySelector('.modal-cancel').addEventListener('click', close);
        modal.querySelector('.modal-overlay').addEventListener('click', close);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !modal.hidden) close();
        });

        $('#change-password-form').addEventListener('submit', async event => {
            event.preventDefault();
            showAlert('#password-error', '');

            const newPass = $('#new-password').value;
            if (newPass !== $('#confirm-password').value) {
                showAlert('#password-error', 'New passwords do not match');
                return;
            }

            const button = event.target.querySelector('button[type="submit"]');
            setBusy(button, true);

            try {
                const json = await post('change_password.php', {
                    current_password: $('#current-password').value,
                    new_password: newPass,
                    confirm_password: $('#confirm-password').value,
                });
                if (!json.ok) throw new Error(json.message || 'Could not update password');
                close();
                toast('Password updated');
            } catch (error) {
                showAlert('#password-error', error.message);
            } finally {
                setBusy(button, false);
            }
        });
    }

    /* ---------------------------------------------------------------------- */

    wireLogin();
    wireDashboardActions();
    wireChangePassword();
    wirePreviews();
    checkSession();
})();
