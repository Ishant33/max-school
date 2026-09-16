/* ==========================================================================
   Mandatory Public Disclosure — CMS screen
   Exposed as window.Disclosure.render(mount, helpers); admin.js calls this
   when the Disclosure module is selected. Helpers (api/post/toast/esc/setBusy)
   are passed in so this file stays free of its own fetch or escaping logic.
   ========================================================================== */

(() => {
    'use strict';

    const TABS = [
        { key: 'general',        label: 'A · General' },
        { key: 'documents',      label: 'B · Documents' },
        { key: 'academics',      label: 'C · Results & Academics' },
        { key: 'staff',          label: 'D · Staff' },
        { key: 'infrastructure', label: 'E · Infrastructure' },
    ];

    // Sections stored as {label, value} pairs and saved as a whole block.
    const PAIR_TABS = ['general', 'staff'];
    // Sections stored as numbered rows with an optional PDF.
    const ROW_TABS = ['documents', 'academics'];

    let H = null;          // helpers from admin.js
    let mount = null;
    let data = null;
    let activeTab = 'general';

    const ENDPOINT = 'disclosure_admin.php';

    const el = (html) => {
        const tpl = document.createElement('template');
        tpl.innerHTML = html.trim();
        return tpl.content.firstElementChild;
    };

    /* ---- load ------------------------------------------------------------- */

    async function render(mountNode, helpers) {
        mount = mountNode;
        H = helpers;
        mount.innerHTML = '<div class="loading-state">Loading disclosure data…</div>';

        try {
            const json = await H.api(`${ENDPOINT}?action=get`);
            if (!json.ok) throw new Error(json.message || 'Could not load disclosure data');
            data = json.data;
            paint();
        } catch (error) {
            mount.innerHTML = `<div class="empty-state">
                <strong>Could not load disclosure data</strong>
                ${H.esc(error.message)}
            </div>`;
        }
    }

    function paint() {
        mount.innerHTML = '';
        mount.className = 'disclosure-screen';

        mount.appendChild(buildSessionBar());
        mount.appendChild(buildTabs());

        const panel = el('<div class="disclosure-panel"></div>');
        mount.appendChild(panel);
        paintPanel(panel);
    }

    /* ---- academic session ------------------------------------------------- */

    function buildSessionBar() {
        const bar = el(`<div class="disclosure-session">
            <label for="disc-updated">Academic session</label>
            <input type="text" id="disc-updated" value="${H.esc(data.updated || '')}"
                   placeholder="2026-27" maxlength="60">
            <button class="btn btn-secondary btn-sm" type="button">
                <span class="btn-text">Save</span><span class="btn-spinner" hidden>●●●</span>
            </button>
        </div>`);

        const button = bar.querySelector('button');
        button.addEventListener('click', async () => {
            H.setBusy(button, true);
            try {
                const json = await H.post(ENDPOINT, {
                    action: 'save_section',
                    section: 'meta',
                    updated: bar.querySelector('#disc-updated').value.trim(),
                });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast('Academic session saved');
            } catch (error) {
                H.toast(error.message, 'error');
            } finally {
                H.setBusy(button, false);
            }
        });

        return bar;
    }

    /* ---- tabs ------------------------------------------------------------- */

    function buildTabs() {
        const nav = el('<div class="disclosure-tabs" role="tablist"></div>');
        TABS.forEach(tab => {
            const count = sectionCount(tab.key);
            const btn = el(`<button type="button" role="tab"
                class="disclosure-tab${tab.key === activeTab ? ' active' : ''}"
                aria-selected="${tab.key === activeTab}">
                ${H.esc(tab.label)}<span class="tab-count">${count}</span>
            </button>`);
            btn.addEventListener('click', () => {
                activeTab = tab.key;
                paint();
            });
            nav.appendChild(btn);
        });
        return nav;
    }

    function sectionCount(key) {
        const section = data[key];
        return Array.isArray(section) ? section.length : 0;
    }

    function paintPanel(panel) {
        if (PAIR_TABS.includes(activeTab)) {
            paintPairEditor(panel, activeTab);
        } else if (activeTab === 'infrastructure') {
            paintInfrastructure(panel);
        } else {
            paintRowEditor(panel, activeTab);
        }
    }
    /* ---- pair editor (General / Staff) ----------------------------------- */

    function paintPairEditor(panel, section) {
        panel.className = 'disclosure-panel disclosure-pair';
        const rows = data[section] || [];
        const tbody = el('<div class="disclosure-rows"></div>');

        function rowsHtml() {
            return rows.map((row, idx) => `
                <div class="disclosure-row" data-index="${idx}">
                    <input type="text" class="disc-label" value="${H.esc(row.label || '')}" placeholder="Label">
                    <input type="text" class="disc-value" value="${H.esc(row.value || '')}" placeholder="Value">
                    <button type="button" class="btn btn-ghost btn-sm disc-remove" title="Remove">✕</button>
                </div>`).join('');
        }

        tbody.innerHTML = rowsHtml();

        // Add a blank row
        const addBtn = el(`<button type="button" class="btn btn-ghost disclosure-add">
            + Add Row
        </button>`);
        addBtn.addEventListener('click', () => {
            rows.push({ label: '', value: '' });
            tbody.innerHTML = rowsHtml();
            wirePairRemove(tbody);
        });

        wirePairRemove(tbody);
        tbody.appendChild(addBtn);

        const saveBtn = el(`<button type="button" class="btn btn-primary">
            <span class="btn-text">Save ${PAIR_TABS.includes(section) ? 'Section' : ''}</span>
            <span class="btn-spinner" hidden>●●●</span>
        </button>`);
        saveBtn.addEventListener('click', async () => {
            H.setBusy(saveBtn, true);
            const collected = [];
            tbody.querySelectorAll('.disclosure-row').forEach(div => {
                const label = div.querySelector('.disc-label').value;
                const value = div.querySelector('.disc-value').value;
                collected.push({ label, value });
            });

            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', section);
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast('Saved');
            } catch (error) {
                H.toast(error.message, 'error');
            } finally {
                H.setBusy(saveBtn, false);
            }
        });

        panel.innerHTML = '';
        panel.appendChild(tbody);
        const actions = el('<div class="disclosure-actions"></div>');
        actions.appendChild(saveBtn);
        panel.appendChild(actions);
    }

    function wirePairRemove(tbody) {
        tbody.querySelectorAll('.disc-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.disclosure-row').remove();
            });
        });
    }

    /* ---- infrastructure ----------------------------------------------- */

    function paintInfrastructure(panel) {
        panel.className = 'disclosure-panel disclosure-pair';
        const items = data.infrastructure || [];
        const tbody = el('<div class="disclosure-rows"></div>');

        function infraHtml() {
            return items.map((item, idx) => `
                <div class="disclosure-row" data-index="${idx}">
                    <input type="text" class="disc-value" value="${H.esc(item)}" placeholder="Facility name" style="flex:1">
                    <button type="button" class="btn btn-ghost btn-sm disc-remove" title="Remove">✕</button>
                </div>`).join('');
        }

        tbody.innerHTML = infraHtml();
        wirePairRemove(tbody);

        const addBtn = el('<button type="button" class="btn btn-ghost disclosure-add">+ Add Facility</button>');
        addBtn.addEventListener('click', () => {
            items.push('');
            tbody.innerHTML = infraHtml();
            wirePairRemove(tbody);
        });

        tbody.appendChild(addBtn);

        const saveBtn = el(`<button type="button" class="btn btn-primary">
            <span class="btn-text">Save</span><span class="btn-spinner" hidden>●●●</span>
        </button>`);
        saveBtn.addEventListener('click', async () => {
            H.setBusy(saveBtn, true);
            const collected = [];
            tbody.querySelectorAll('.disclosure-row .disc-value').forEach(input => {
                collected.push({ value: input.value });
            });
            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', 'infrastructure');
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast('Saved');
            } catch (error) {
                H.toast(error.message, 'error');
            } finally {
                H.setBusy(saveBtn, false);
            }
        });

        panel.innerHTML = '';
        panel.appendChild(tbody);
        const actions = el('<div class="disclosure-actions"></div>');
        actions.appendChild(saveBtn);
        panel.appendChild(actions);
    }
    /* ---- row editor (Documents B / Academics C) --------------------------- */

    let editingRow = null;

    function paintRowEditor(panel, section) {
        panel.className = 'disclosure-panel disclosure-rows-panel';
        const rows = data[section] || [];
        const titleKey = section === 'documents' ? 'title' : 'label';

        // Row list
        const list = el('<div class="dr-list"></div>');
        function listHtml() {
            if (!rows.length) {
                return '<div class="empty-state" style="grid-column:1/-1">No entries yet — add one below.</div>';
            }
            return rows.map(row => `
                <div class="dr-card" data-id="${row.id}">
                    <div class="dr-card-body">
                        <strong>${H.esc(row[titleKey] || '')}</strong>
                        <span class="text-muted">${H.esc((row.description || row.value || '').slice(0, 80))}</span>
                    </div>
                    <div class="dr-card-actions">
                        ${row.pdf_url ? `<a class="tag tag-link" href="${H.esc(row.pdf_url)}" target="_blank" rel="noopener">View PDF</a>` : ''}
                        <button class="btn btn-ghost btn-sm" data-edit="${row.id}">Edit</button>
                        <button class="btn btn-danger btn-sm" data-delete="${row.id}">Delete</button>
                    </div>
                </div>`).join('');
        }
        list.innerHTML = listHtml();

        list.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = rows.find(r => String(r.id) === btn.dataset.edit);
                if (row) openRowForm(panel, section, row);
            });
        });
        list.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.delete);
                H.setBusy(btn, true);
                try {
                    const fd = new FormData();
                    fd.append('action', 'delete_row');
                    fd.append('section', section);
                    fd.append('id', id);
                    const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                    if (!json.ok) throw new Error(json.message || 'Delete failed');
                    const idx = rows.findIndex(r => r.id === id);
                    if (idx >= 0) rows.splice(idx, 1);
                    H.toast('Row deleted');
                    paintRowEditor(panel, section);
                } catch (error) {
                    H.toast(error.message, 'error');
                    H.setBusy(btn, false);
                }
            });
        });

        const addBtn = el('<button type="button" class="btn btn-ghost disclosure-add">+ Add Entry</button>');
        addBtn.addEventListener('click', () => openRowForm(panel, section, null));

        panel.innerHTML = '';
        panel.appendChild(list);
        panel.appendChild(addBtn);
    }

    function openRowForm(panel, section, row) {
        editingRow = row;
        const isDoc = section === 'documents';

        const form = el(`<div class="dr-form card">
            <div class="card-header">
                <h3>${row ? 'Edit' : 'Add'} Entry</h3>
                <button class="btn btn-ghost btn-sm dr-form-cancel">Cancel</button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>${isDoc ? 'Document Name *' : 'Label *'}</label>
                    <input type="text" id="dr-title" value="${H.esc(row ? (isDoc ? row.title : row.label) : '')}" placeholder="${isDoc ? 'e.g., Affiliation Letter' : 'e.g., Board'}" maxlength="200">
                </div>
                <div class="form-group">
                    <label>${isDoc ? 'Description' : 'Value'}</label>
                    <input type="text" id="dr-body" value="${H.esc(row ? (isDoc ? row.description : row.value) : '')}" placeholder="${isDoc ? 'Short description' : 'e.g., Central Board of Secondary Education'}" maxlength="1000">
                </div>
                <div class="form-group">
                    <label for="dr-pdf-url">PDF URL</label>
                    <input type="url" id="dr-pdf-url" value="${H.esc(row ? (row.pdf_url || '') : '')}" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="dr-pdf-file">
                        Or upload PDF
                        <span class="field-hint">Max 10 MB</span>
                    </label>
                    <input type="file" id="dr-pdf-file" accept="application/pdf">
                    <div id="dr-pdf-preview" class="file-preview" hidden></div>
                </div>
                <div class="form-actions" style="margin-top:16px">
                    <button type="button" class="btn btn-primary dr-form-save">
                        <span class="btn-text">${row ? 'Update' : 'Add'} Entry</span>
                        <span class="btn-spinner" hidden>●●●</span>
                    </button>
                </div>
            </div>
        </div>`);

        // Insert form before the add button
        const addBtn = panel.querySelector('.disclosure-add');
        addBtn.style.display = 'none';
        panel.appendChild(form);
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // PDF preview
        form.querySelector('#dr-pdf-file').addEventListener('change', event => {
            const file = event.target.files[0];
            const box = form.querySelector('#dr-pdf-preview');
            if (!file) { box.hidden = true; return; }
            const size = (file.size / (1024 * 1024)).toFixed(1);
            box.innerHTML = `<span>📄</span><span class="preview-name">${H.esc(file.name)} — ${size} MB</span>`;
            box.hidden = false;
        });

        form.querySelector('.dr-form-cancel').addEventListener('click', () => {
            editingRow = null;
            form.remove();
            addBtn.style.display = '';
        });

        form.querySelector('.dr-form-save').addEventListener('click', async (e) => {
            H.setBusy(e.currentTarget, true);
            try {
                const pdfInput = form.querySelector('#dr-pdf-file');
                let pdfUrl = form.querySelector('#dr-pdf-url').value.trim();

                if (pdfInput.files[0]) {
                    const fd = new FormData();
                    fd.append('action', 'upload_pdf');
                    fd.append('section', section);
                    fd.append('file', pdfInput.files[0]);
                    const up = await H.api(ENDPOINT, { method: 'POST', body: fd });
                    if (!up.ok) throw new Error(up.message || 'Upload failed');
                    pdfUrl = up.url;
                }

                const payload = new FormData();
                payload.append('action', 'upsert_row');
                payload.append('section', section);
                if (row) payload.append('id', row.id);
                payload.append(isDoc ? 'title' : 'label', form.querySelector('#dr-title').value.trim());
                payload.append(isDoc ? 'description' : 'value', form.querySelector('#dr-body').value.trim());
                payload.append('pdf_url', pdfUrl);

                const json = await H.api(ENDPOINT, { method: 'POST', body: payload });
                if (!json.ok) throw new Error(json.message || 'Save failed');

                // Update local data
                const rows = data[section];
                if (row) {
                    const idx = rows.findIndex(r => r.id === row.id);
                    if (idx >= 0) rows[idx] = json.data;
                } else {
                    rows.push(json.data);
                }
                data[section] = rows;

                H.toast(row ? 'Entry updated' : 'Entry added');
                editingRow = null;
                // Re-paint the whole panel so the list updates.
                paint();
            } catch (error) {
                H.toast(error.message, 'error');
                H.setBusy(e.currentTarget, false);
            }
        });
    }

    window.Disclosure = { render };


})();
