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
        if (!data) return 0;
        if (key === 'academics') {
            return (data.academics || []).length +
                   (data.results_x || []).length +
                   (data.results_xii || []).length;
        }
        if (key === 'infrastructure') {
            return (data.infrastructure_specs || []).length +
                   (data.infrastructure || []).length;
        }
        const section = data[key];
        return Array.isArray(section) ? section.length : 0;
    }

    function paintPanel(panel) {
        if (activeTab === 'general' || activeTab === 'staff') {
            paintPairEditor(panel, activeTab);
        } else if (activeTab === 'documents') {
            paintRowEditor(panel, 'documents');
        } else if (activeTab === 'academics') {
            paintAcademicsTab(panel);
        } else if (activeTab === 'infrastructure') {
            paintInfrastructureTab(panel);
        }
    }

    /* ---- pair editor (General A / Staff D) with REORDER ------------------- */

    function paintPairEditor(panel, section) {
        panel.className = 'disclosure-panel disclosure-pair';
        const rows = data[section] || [];
        const tbody = el('<div class="disclosure-rows"></div>');

        function rowsHtml() {
            return rows.map((row, idx) => `
                <div class="disclosure-row" data-index="${idx}">
                    <div class="row-reorder-btns">
                        <button type="button" class="btn btn-ghost btn-sm disc-move-up" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="btn btn-ghost btn-sm disc-move-down" title="Move Down" ${idx === rows.length - 1 ? 'disabled' : ''}>▼</button>
                    </div>
                    <input type="text" class="disc-label" value="${H.esc(row.label || '')}" placeholder="Label">
                    <input type="text" class="disc-value" value="${H.esc(row.value || '')}" placeholder="Value">
                    <button type="button" class="btn btn-ghost btn-sm disc-remove" title="Remove">✕</button>
                </div>`).join('');
        }

        function syncCurrentInputs() {
            tbody.querySelectorAll('.disclosure-row').forEach(div => {
                const i = parseInt(div.dataset.index, 10);
                if (rows[i]) {
                    rows[i].label = div.querySelector('.disc-label').value.trim();
                    rows[i].value = div.querySelector('.disc-value').value.trim();
                }
            });
        }

        async function autoSavePair(msg) {
            syncCurrentInputs();
            const collected = [];
            rows.forEach(r => {
                if (r.label || r.value) {
                    collected.push({ label: r.label, value: r.value });
                }
            });
            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', section);
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast(msg || `${sectionName} saved`);
            } catch (err) {
                H.toast('Save failed: ' + err.message, 'error');
            }
        }

        function wirePairEvents() {
            tbody.querySelectorAll('.disc-remove').forEach(btn => {
                btn.addEventListener('click', async () => {
                    syncCurrentInputs();
                    const i = parseInt(btn.closest('.disclosure-row').dataset.index, 10);
                    rows.splice(i, 1);
                    refreshTbody();
                    await autoSavePair(`${sectionName} row removed & saved`);
                });
            });

            tbody.querySelectorAll('.disc-move-up').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const i = parseInt(btn.closest('.disclosure-row').dataset.index, 10);
                    if (i <= 0) return;
                    syncCurrentInputs();
                    const tmp = rows[i - 1];
                    rows[i - 1] = rows[i];
                    rows[i] = tmp;
                    refreshTbody();
                    await autoSavePair(`${sectionName} order moved up & saved`);
                });
            });

            tbody.querySelectorAll('.disc-move-down').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const i = parseInt(btn.closest('.disclosure-row').dataset.index, 10);
                    if (i >= rows.length - 1) return;
                    syncCurrentInputs();
                    const tmp = rows[i + 1];
                    rows[i + 1] = rows[i];
                    rows[i] = tmp;
                    refreshTbody();
                    await autoSavePair(`${sectionName} order moved down & saved`);
                });
            });
        }

        function refreshTbody() {
            tbody.innerHTML = rowsHtml();
            wirePairEvents();
            tbody.appendChild(addBtn);
        }

        const addBtn = el(`<button type="button" class="btn btn-ghost disclosure-add">
            + Add Row
        </button>`);
        addBtn.addEventListener('click', () => {
            syncCurrentInputs();
            rows.push({ label: '', value: '' });
            refreshTbody();
        });

        tbody.innerHTML = rowsHtml();
        wirePairEvents();
        tbody.appendChild(addBtn);

        const sectionName = section === 'general' ? 'General Information' : 'Staff Details';
        const saveBtn = el(`<button type="button" class="btn btn-primary">
            <span class="btn-text">Save ${sectionName}</span>
            <span class="btn-spinner" hidden>●●●</span>
        </button>`);
        saveBtn.addEventListener('click', async () => {
            H.setBusy(saveBtn, true);
            syncCurrentInputs();
            const collected = [];
            rows.forEach(r => {
                if (r.label || r.value) {
                    collected.push({ label: r.label, value: r.value });
                }
            });

            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', section);
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast(`${sectionName} order & details saved`);
                paint();
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

    /* ---- Tab C: Results & Academics --------------------------------------- */

    function paintAcademicsTab(panel) {
        panel.className = 'disclosure-panel';
        panel.innerHTML = '';

        // 1. Statutory Academic Documents
        const docHeader = el(`<div class="disc-sub-header">
            <h4 class="disc-sub-title">Academic Documents &amp; Committees</h4>
            <p class="disc-sub-desc">Statutory fee structure, academic calendar, SMC, PTA, and other academic notices. Use ▲/▼ to change published order.</p>
        </div>`);
        panel.appendChild(docHeader);

        const docBox = el('<div></div>');
        panel.appendChild(docBox);
        paintRowEditor(docBox, 'academics');

        // 2. Result Class: X
        const xHeader = el(`<div class="disc-sub-header">
            <h4 class="disc-sub-title">Result Class: X (Last 3 Years)</h4>
            <p class="disc-sub-desc">Board examination results for Class 10: Year, Registered Students, Passed Students, Pass %, and Result PDF. Use ▲/▼ to reorder years.</p>
        </div>`);
        panel.appendChild(xHeader);
        panel.appendChild(buildBoardResultsTable('results_x', 'Class X'));

        // 3. Result Class: XII
        const xiiHeader = el(`<div class="disc-sub-header">
            <h4 class="disc-sub-title">Result Class: XII (Last 3 Years)</h4>
            <p class="disc-sub-desc">Board examination results for Class 12: Year, Registered Students, Passed Students, Pass %, and Result PDF. Use ▲/▼ to reorder years.</p>
        </div>`);
        panel.appendChild(xiiHeader);
        panel.appendChild(buildBoardResultsTable('results_xii', 'Class XII'));
    }

    function buildBoardResultsTable(sectionKey, classNameLabel) {
        const rows = data[sectionKey] || [];
        const container = el('<div></div>');

        function tableHtml() {
            return `
            <div class="disc-table-wrap">
                <table class="disc-admin-table">
                    <thead>
                        <tr>
                            <th style="width:70px; text-align:center;">Order</th>
                            <th style="width:60px;">S.No.</th>
                            <th style="width:110px;">Year</th>
                            <th style="width:110px;">Registered</th>
                            <th style="width:110px;">Passed</th>
                            <th style="width:110px;">Pass %</th>
                            <th>Result PDF</th>
                            <th style="width:50px; text-align:center;">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((r, idx) => `
                        <tr data-index="${idx}">
                            <td style="text-align:center;">
                                <div class="row-reorder-btns" style="justify-content:center;">
                                    <button type="button" class="btn btn-ghost btn-sm row-move-up" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
                                    <button type="button" class="btn btn-ghost btn-sm row-move-down" title="Move Down" ${idx === rows.length - 1 ? 'disabled' : ''}>▼</button>
                                </div>
                            </td>
                            <td><input type="text" class="disc-input-sno row-sno" value="${H.esc(r.sno || (idx + 1))}" placeholder="#"></td>
                            <td><input type="text" class="row-year" value="${H.esc(r.year || '')}" placeholder="2023-24"></td>
                            <td><input type="text" class="row-reg" value="${H.esc(r.registered || '')}" placeholder="e.g. 99"></td>
                            <td><input type="text" class="row-passed" value="${H.esc(r.passed || '')}" placeholder="e.g. 89"></td>
                            <td><input type="text" class="row-pct" value="${H.esc(r.pct || '')}" placeholder="e.g. 89.90%"></td>
                            <td>
                                <div style="display:flex; gap:6px; align-items:center;">
                                    <input type="text" class="row-pdf" value="${H.esc(r.pdf || '')}" placeholder="PDF URL or upload" style="flex:1;">
                                    <button type="button" class="btn btn-secondary btn-sm row-upload-btn" title="Upload PDF">Upload</button>
                                    <input type="file" class="row-file" accept="application/pdf" style="display:none;">
                                    ${r.pdf ? `<a href="${H.esc(r.pdf)}" target="_blank" rel="noopener" class="tag tag-link" style="white-space:nowrap;">View</a>` : ''}
                                </div>
                            </td>
                            <td style="text-align:center;">
                                <button type="button" class="btn btn-ghost btn-sm row-delete-btn" title="Delete">✕</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        }

        function syncTableInputs() {
            container.querySelectorAll('tbody tr').forEach(tr => {
                const i = parseInt(tr.dataset.index, 10);
                if (rows[i]) {
                    rows[i].sno = tr.querySelector('.row-sno').value.trim();
                    rows[i].year = tr.querySelector('.row-year').value.trim();
                    rows[i].registered = tr.querySelector('.row-reg').value.trim();
                    rows[i].passed = tr.querySelector('.row-passed').value.trim();
                    rows[i].pct = tr.querySelector('.row-pct').value.trim();
                    rows[i].pdf = tr.querySelector('.row-pdf').value.trim();
                }
            });
        }

        function refreshTable() {
            const wrap = container.querySelector('.disc-table-wrap');
            if (wrap) wrap.outerHTML = el(tableHtml()).outerHTML;
            else container.innerHTML = tableHtml();
            wireTableEvents();
        }

        async function autoSaveResultsTable(msg) {
            syncTableInputs();
            const collected = [];
            rows.forEach((r, n) => {
                if (r.year || r.registered || r.passed || r.pct || r.pdf) {
                    collected.push({
                        sno: String(n + 1),
                        year: r.year || '',
                        registered: r.registered || '',
                        passed: r.passed || '',
                        pct: r.pct || '',
                        pdf: r.pdf || ''
                    });
                }
            });
            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', sectionKey);
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast(msg || `${classNameLabel} results saved`);
            } catch (err) {
                H.toast('Save failed: ' + err.message, 'error');
            }
        }

        function wireTableEvents() {
            container.querySelectorAll('tbody tr').forEach((tr, idx) => {
                const delBtn = tr.querySelector('.row-delete-btn');
                delBtn.addEventListener('click', async () => {
                    syncTableInputs();
                    rows.splice(idx, 1);
                    rows.forEach((r, n) => { r.sno = String(n + 1); });
                    refreshTable();
                    await autoSaveResultsTable(`${classNameLabel} row removed & saved`);
                });

                const upBtn = tr.querySelector('.row-move-up');
                if (upBtn) {
                    upBtn.addEventListener('click', async () => {
                        if (idx <= 0) return;
                        syncTableInputs();
                        const tmp = rows[idx - 1];
                        rows[idx - 1] = rows[idx];
                        rows[idx] = tmp;
                        rows.forEach((r, n) => { r.sno = String(n + 1); });
                        refreshTable();
                        await autoSaveResultsTable(`${classNameLabel} order moved up & saved`);
                    });
                }

                const downBtn = tr.querySelector('.row-move-down');
                if (downBtn) {
                    downBtn.addEventListener('click', async () => {
                        if (idx >= rows.length - 1) return;
                        syncTableInputs();
                        const tmp = rows[idx + 1];
                        rows[idx + 1] = rows[idx];
                        rows[idx] = tmp;
                        rows.forEach((r, n) => { r.sno = String(n + 1); });
                        refreshTable();
                        await autoSaveResultsTable(`${classNameLabel} order moved down & saved`);
                    });
                }

                const uploadBtn = tr.querySelector('.row-upload-btn');
                const fileInput = tr.querySelector('.row-file');
                const pdfInput = tr.querySelector('.row-pdf');

                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', async () => {
                    const file = fileInput.files[0];
                    if (!file) return;
                    H.setBusy(uploadBtn, true);
                    try {
                        const fd = new FormData();
                        fd.append('action', 'upload_pdf');
                        fd.append('section', sectionKey);
                        fd.append('file', file);
                        const up = await H.api(ENDPOINT, { method: 'POST', body: fd });
                        if (!up.ok) throw new Error(up.message || 'Upload failed');
                        pdfInput.value = up.url;
                        rows[idx].pdf = up.url;
                        H.toast('PDF uploaded');
                    } catch (err) {
                        H.toast(err.message, 'error');
                    } finally {
                        H.setBusy(uploadBtn, false);
                    }
                });
            });
        }

        container.innerHTML = tableHtml();
        wireTableEvents();

        const toolBar = el(`<div style="display:flex; gap:10px; margin-top:10px; margin-bottom:20px; align-items:center;">
            <button type="button" class="btn btn-ghost btn-sm btn-add-year">+ Add Year Row</button>
            <button type="button" class="btn btn-primary btn-sm btn-save-results">
                <span class="btn-text">Save ${classNameLabel} Results</span>
                <span class="btn-spinner" hidden>●●●</span>
            </button>
        </div>`);

        toolBar.querySelector('.btn-add-year').addEventListener('click', () => {
            syncTableInputs();
            rows.push({
                sno: String(rows.length + 1),
                year: '',
                registered: '',
                passed: '',
                pct: '',
                pdf: ''
            });
            refreshTable();
        });

        const saveBtn = toolBar.querySelector('.btn-save-results');
        saveBtn.addEventListener('click', async () => {
            H.setBusy(saveBtn, true);
            syncTableInputs();
            const collected = [];
            rows.forEach(r => {
                if (r.year || r.registered || r.passed || r.pct || r.pdf) {
                    collected.push({
                        sno: r.sno || '',
                        year: r.year || '',
                        registered: r.registered || '',
                        passed: r.passed || '',
                        pct: r.pct || '',
                        pdf: r.pdf || ''
                    });
                }
            });

            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', sectionKey);
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast(`${classNameLabel} Results & order saved`);
                paint();
            } catch (error) {
                H.toast(error.message, 'error');
            } finally {
                H.setBusy(saveBtn, false);
            }
        });

        container.appendChild(toolBar);
        return container;
    }

    /* ---- Tab E: Infrastructure with REORDER -------------------------------- */

    function paintInfrastructureTab(panel) {
        panel.className = 'disclosure-panel';
        panel.innerHTML = '';

        // 1. Official CBSE Infrastructure Specifications (9 rows)
        const specHeader = el(`<div class="disc-sub-header">
            <h4 class="disc-sub-title">CBSE Infrastructure Specifications (Official Appendix-IX Table)</h4>
            <p class="disc-sub-desc">Mandatory specification rows: Total Campus Area, Classrooms, Labs, Library, Internet, Toilets, YouTube video link. Use ▲/▼ to reorder.</p>
        </div>`);
        panel.appendChild(specHeader);

        const specs = data.infrastructure_specs || [];
        const specBox = el('<div class="disclosure-rows"></div>');

        function specsHtml() {
            return specs.map((row, idx) => `
                <div class="disclosure-row" data-index="${idx}" style="align-items:flex-start;">
                    <div class="row-reorder-btns" style="padding-top:6px;">
                        <button type="button" class="btn btn-ghost btn-sm spec-move-up" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="btn btn-ghost btn-sm spec-move-down" title="Move Down" ${idx === specs.length - 1 ? 'disabled' : ''}>▼</button>
                    </div>
                    <input type="text" class="disc-input-sno spec-sno" value="${H.esc(row.sno || (idx + 1))}" placeholder="#" style="max-width:55px;">
                    <input type="text" class="disc-label spec-label" value="${H.esc(row.label || '')}" placeholder="Specification Information (e.g. Total Campus Area)" style="flex:1.2;">
                    <input type="text" class="disc-value spec-value" value="${H.esc(row.value || '')}" placeholder="Details / Values" style="flex:1.8;">
                    <button type="button" class="btn btn-ghost btn-sm disc-remove" title="Remove">✕</button>
                </div>`).join('');
        }

        function syncSpecInputs() {
            specBox.querySelectorAll('.disclosure-row').forEach(div => {
                const i = parseInt(div.dataset.index, 10);
                if (specs[i]) {
                    specs[i].sno = div.querySelector('.spec-sno').value.trim();
                    specs[i].label = div.querySelector('.spec-label').value.trim();
                    specs[i].value = div.querySelector('.spec-value').value.trim();
                }
            });
        }

        async function autoSaveSpecs(msg) {
            syncSpecInputs();
            const collected = [];
            specs.forEach((s, n) => {
                if (s.label || s.value) {
                    collected.push({ sno: String(n + 1) + '.', label: s.label || '', value: s.value || '' });
                }
            });
            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', 'infrastructure_specs');
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast(msg || 'Specifications saved');
            } catch (err) {
                H.toast('Save failed: ' + err.message, 'error');
            }
        }

        function wireSpecEvents() {
            specBox.querySelectorAll('.disc-remove').forEach(btn => {
                btn.addEventListener('click', async () => {
                    syncSpecInputs();
                    const i = parseInt(btn.closest('.disclosure-row').dataset.index, 10);
                    specs.splice(i, 1);
                    specs.forEach((s, n) => { s.sno = String(n + 1) + '.'; });
                    refreshSpecBox();
                    await autoSaveSpecs('Specification removed & saved');
                });
            });

            specBox.querySelectorAll('.spec-move-up').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const i = parseInt(btn.closest('.disclosure-row').dataset.index, 10);
                    if (i <= 0) return;
                    syncSpecInputs();
                    const tmp = specs[i - 1];
                    specs[i - 1] = specs[i];
                    specs[i] = tmp;
                    specs.forEach((s, n) => { s.sno = String(n + 1) + '.'; });
                    refreshSpecBox();
                    await autoSaveSpecs('Specification moved up & saved');
                });
            });

            specBox.querySelectorAll('.spec-move-down').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const i = parseInt(btn.closest('.disclosure-row').dataset.index, 10);
                    if (i >= specs.length - 1) return;
                    syncSpecInputs();
                    const tmp = specs[i + 1];
                    specs[i + 1] = specs[i];
                    specs[i] = tmp;
                    specs.forEach((s, n) => { s.sno = String(n + 1) + '.'; });
                    refreshSpecBox();
                    await autoSaveSpecs('Specification moved down & saved');
                });
            });
        }

        function refreshSpecBox() {
            specBox.innerHTML = specsHtml();
            wireSpecEvents();
            specBox.appendChild(addSpecBtn);
        }

        const addSpecBtn = el('<button type="button" class="btn btn-ghost disclosure-add">+ Add Specification Row</button>');
        addSpecBtn.addEventListener('click', () => {
            syncSpecInputs();
            specs.push({ sno: String(specs.length + 1), label: '', value: '' });
            refreshSpecBox();
        });

        specBox.innerHTML = specsHtml();
        wireSpecEvents();
        specBox.appendChild(addSpecBtn);

        const saveSpecBtn = el(`<button type="button" class="btn btn-primary">
            <span class="btn-text">Save CBSE Specifications</span>
            <span class="btn-spinner" hidden>●●●</span>
        </button>`);
        saveSpecBtn.addEventListener('click', async () => {
            H.setBusy(saveSpecBtn, true);
            syncSpecInputs();
            const collected = [];
            specs.forEach(s => {
                if (s.label || s.value) {
                    collected.push({ sno: s.sno || '', label: s.label || '', value: s.value || '' });
                }
            });

            try {
                const fd = new FormData();
                fd.append('action', 'save_section');
                fd.append('section', 'infrastructure_specs');
                fd.append('rows', JSON.stringify(collected));
                const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                if (!json.ok) throw new Error(json.message || 'Save failed');
                data = json.data;
                H.toast('CBSE Infrastructure specifications & order saved');
                paint();
            } catch (error) {
                H.toast(error.message, 'error');
            } finally {
                H.setBusy(saveSpecBtn, false);
            }
        });

        panel.appendChild(specBox);
        const specActions = el('<div class="disclosure-actions"></div>');
        specActions.appendChild(saveSpecBtn);
        panel.appendChild(specActions);
    }

    /* ---- row editor (Documents B / Academics Documents) with REORDER -------- */

    let editingRow = null;

    function paintRowEditor(panel, section) {
        panel.className = 'disclosure-panel disclosure-rows-panel';
        const rows = data[section] || [];
        const titleKey = section === 'documents' ? 'title' : 'label';

        const list = el('<div class="dr-list"></div>');
        function listHtml() {
            if (!rows.length) {
                return '<div class="empty-state" style="grid-column:1/-1">No entries yet — add one below.</div>';
            }
            return rows.map((row, idx) => {
                const tagNo = (row.sno && isNaN(Number(row.sno))) ? row.sno : (idx + 1);
                return `
                <div class="dr-card" data-id="${row.id}">
                    <div class="dr-card-body">
                        <strong><span class="tag" style="margin-right:6px">#${H.esc(tagNo)}</span>${H.esc(row[titleKey] || '')}</strong>
                        <span class="text-muted">${H.esc((row.description || row.value || '').slice(0, 80))}</span>
                    </div>
                    <div class="dr-card-actions">
                        <button type="button" class="btn btn-ghost btn-sm dr-reorder-btn dr-move-up" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="btn btn-ghost btn-sm dr-reorder-btn dr-move-down" title="Move Down" ${idx === rows.length - 1 ? 'disabled' : ''}>▼</button>
                        ${row.pdf_url ? `<a class="tag tag-link" href="${H.esc(row.pdf_url)}" target="_blank" rel="noopener">View PDF</a>` : ''}
                        <button class="btn btn-ghost btn-sm" data-edit="${row.id}">Edit</button>
                        <button class="btn btn-danger btn-sm" data-delete="${row.id}">Delete</button>
                    </div>
                </div>`;
            }).join('');
        }
        list.innerHTML = listHtml();

        // Wire Reorder (Move Up)
        list.querySelectorAll('.dr-move-up').forEach(btn => {
            btn.addEventListener('click', async () => {
                const card = btn.closest('.dr-card');
                const id = Number(card.dataset.id);
                const idx = rows.findIndex(r => r.id === id);
                if (idx <= 0) return;
                H.setBusy(btn, true);
                try {
                    const tmp = rows[idx - 1];
                    rows[idx - 1] = rows[idx];
                    rows[idx] = tmp;
                    const order = rows.map(r => r.id);
                    const fd = new FormData();
                    fd.append('action', 'reorder_rows');
                    fd.append('section', section);
                    fd.append('order', JSON.stringify(order));
                    const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                    if (!json.ok) throw new Error(json.message || 'Reorder failed');
                    data[section] = json.data;
                    H.toast('Order updated & saved');
                    paint();
                } catch (error) {
                    H.toast(error.message, 'error');
                    H.setBusy(btn, false);
                }
            });
        });

        // Wire Reorder (Move Down)
        list.querySelectorAll('.dr-move-down').forEach(btn => {
            btn.addEventListener('click', async () => {
                const card = btn.closest('.dr-card');
                const id = Number(card.dataset.id);
                const idx = rows.findIndex(r => r.id === id);
                if (idx >= rows.length - 1) return;
                H.setBusy(btn, true);
                try {
                    const tmp = rows[idx + 1];
                    rows[idx + 1] = rows[idx];
                    rows[idx] = tmp;
                    const order = rows.map(r => r.id);
                    const fd = new FormData();
                    fd.append('action', 'reorder_rows');
                    fd.append('section', section);
                    fd.append('order', JSON.stringify(order));
                    const json = await H.api(ENDPOINT, { method: 'POST', body: fd });
                    if (!json.ok) throw new Error(json.message || 'Reorder failed');
                    data[section] = json.data;
                    H.toast('Order updated & saved');
                    paint();
                } catch (error) {
                    H.toast(error.message, 'error');
                    H.setBusy(btn, false);
                }
            });
        });

        // Wire Edit
        list.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = rows.find(r => String(r.id) === btn.dataset.edit);
                if (row) openRowForm(panel, section, row);
            });
        });

        // Wire Delete
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
                    if (json.data) {
                        data[section] = json.data;
                    } else {
                        const idx = rows.findIndex(r => r.id === id);
                        if (idx >= 0) rows.splice(idx, 1);
                    }
                    H.toast('Row deleted & saved');
                    paint();
                } catch (error) {
                    H.toast(error.message, 'error');
                    H.setBusy(btn, false);
                }
            });
        });

        const addBtn = el('<button type="button" class="btn btn-ghost disclosure-add" style="margin-top:12px;">+ Add Entry</button>');
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
                    <label>S.No <span class="field-hint">Optional (e.g., 1, 11.1, auto-numbered if blank)</span></label>
                    <input type="text" id="dr-sno" value="${H.esc(row ? (row.sno || '') : '')}" placeholder="e.g., 1 or 11.1" maxlength="20">
                </div>
                <div class="form-group">
                    <label>${isDoc ? 'Document Name *' : 'Label *'}</label>
                    <input type="text" id="dr-title" value="${H.esc(row ? (isDoc ? row.title : row.label) : '')}" placeholder="${isDoc ? 'e.g., Affiliation Letter' : 'e.g., Board'}" maxlength="200">
                </div>
                <div class="form-group">
                    <label>${isDoc ? 'Description' : 'Value'}</label>
                    <input type="text" id="dr-body" value="${H.esc(row ? (isDoc ? row.description : row.value) : '')}" placeholder="${isDoc ? 'Short description' : 'e.g., Details'}" maxlength="1000">
                </div>
                <div class="form-group">
                    <label for="dr-pdf-url">PDF URL</label>
                    <input type="url" id="dr-pdf-url" value="${H.esc(row ? (row.pdf_url || '') : '')}" placeholder="https://... or upload below">
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

        const addBtn = panel.querySelector('.disclosure-add');
        if (addBtn) addBtn.style.display = 'none';
        panel.appendChild(form);
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });

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
            if (addBtn) addBtn.style.display = '';
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
                const snoInput = form.querySelector('#dr-sno');
                if (snoInput && snoInput.value.trim() !== '') {
                    payload.append('sno', snoInput.value.trim());
                }
                payload.append(isDoc ? 'title' : 'label', form.querySelector('#dr-title').value.trim());
                payload.append(isDoc ? 'description' : 'value', form.querySelector('#dr-body').value.trim());
                payload.append('pdf_url', pdfUrl);

                const json = await H.api(ENDPOINT, { method: 'POST', body: payload });
                if (!json.ok) throw new Error(json.message || 'Save failed');

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
                paint();
            } catch (error) {
                H.toast(error.message, 'error');
                H.setBusy(e.currentTarget, false);
            }
        });
    }

    window.Disclosure = { render };

})();
