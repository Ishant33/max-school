/* ==========================================================================
   Fee Structure — CMS Screen
   Exposed as window.FeeAdmin.render(mount, helpers); admin.js calls this
   when the Fee Structure module is selected.
   ========================================================================== */

(() => {
    'use strict';

    let H = null; // helpers passed from admin.js: api, post, toast, esc, setBusy
    let mount = null;
    let data = null;
    let editingRowId = null;

    const ENDPOINT = 'fee_admin.php';

    const el = (html) => {
        const tpl = document.createElement('template');
        tpl.innerHTML = html.trim();
        return tpl.content.firstElementChild;
    };

    async function render(mountNode, helpers) {
        mount = mountNode;
        H = helpers;
        mount.innerHTML = '<div class="loading-state">Loading fee structure…</div>';

        try {
            const json = await H.api(`${ENDPOINT}?action=get`);
            if (!json.ok) throw new Error(json.message || 'Could not load fee data');
            data = json.data;
            paint();
        } catch (error) {
            mount.innerHTML = `<div class="empty-state">
                <strong>Could not load fee structure</strong>
                ${H.esc(error.message)}
            </div>`;
        }
    }

    function paint() {
        mount.innerHTML = '';
        mount.className = 'fee-admin-screen';

        // 1. General Info & Session Card
        mount.appendChild(buildGeneralCard());

        // 2. Fee Table Rows Card
        mount.appendChild(buildRowsCard());

        // 3. Scholarship Box Card
        mount.appendChild(buildScholarshipCard());

        // 4. Fee PDF Card
        mount.appendChild(buildPdfCard());
    }

    /* --------------------------------------------------------------------------
       1. General & Header Info Card
       -------------------------------------------------------------------------- */
    function buildGeneralCard() {
        const card = el(`<section class="fee-admin-card">
            <div class="fee-admin-card-head">
                <div>
                    <h3>Page Header &amp; Academic Session</h3>
                    <p>Configure the fee section title, session year, and advisory note shown on the Admission page.</p>
                </div>
            </div>
            <form id="fee-general-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="fee-session">Academic Session</label>
                        <input type="text" id="fee-session" value="${H.esc(data.academic_session || '2026–27')}" placeholder="2026–27">
                    </div>
                    <div class="form-group">
                        <label for="fee-eyebrow">Eyebrow Badge</label>
                        <input type="text" id="fee-eyebrow" value="${H.esc(data.eyebrow || 'Transparent Pricing')}" placeholder="Transparent Pricing">
                    </div>
                    <div class="form-group">
                        <label for="fee-title">Section Title</label>
                        <input type="text" id="fee-title" value="${H.esc(data.title || '3. Fee Structure')}" placeholder="3. Fee Structure">
                    </div>
                </div>
                <div class="form-group">
                    <label for="fee-desc">Notice / Description Note</label>
                    <textarea id="fee-desc" rows="3" placeholder="Contact the school office for the current fee schedule...">${H.esc(data.description || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-sm">
                        <span class="btn-text">Save Header Details</span>
                        <span class="btn-spinner" hidden>●●●</span>
                    </button>
                </div>
            </form>
        </section>`);

        const form = card.querySelector('#fee-general-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            H.setBusy(submitBtn, true);
            try {
                const res = await H.post(ENDPOINT, {
                    action: 'save_general',
                    academic_session: form.querySelector('#fee-session').value.trim(),
                    eyebrow: form.querySelector('#fee-eyebrow').value.trim(),
                    title: form.querySelector('#fee-title').value.trim(),
                    description: form.querySelector('#fee-desc').value.trim(),
                });
                if (!res.ok) throw new Error(res.message || 'Save failed');
                data = res.data;
                H.toast('Header details saved successfully');
            } catch (err) {
                H.toast(err.message, 'error');
            } finally {
                H.setBusy(submitBtn, false);
            }
        });

        return card;
    }

    /* --------------------------------------------------------------------------
       2. Fee Schedule Rows Card
       -------------------------------------------------------------------------- */
    function buildRowsCard() {
        const card = el(`<section class="fee-admin-card">
            <div class="fee-admin-card-head">
                <div>
                    <h3>Grade-Wise Fee Rows</h3>
                    <p>Add, edit, reorder or remove class stages and fee specifications.</p>
                </div>
                <button id="add-fee-row-btn" class="btn btn-secondary btn-sm" type="button">
                    + Add New Row
                </button>
            </div>

            <!-- Row Add / Edit Form Container (toggled) -->
            <div id="fee-row-editor-wrap" hidden></div>

            <div class="fee-table-wrap">
                <table class="fee-admin-table">
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">#</th>
                            <th style="width: 25%;">Stage</th>
                            <th style="width: 25%;">Grades</th>
                            <th>Fee Details / Amount</th>
                            <th style="width: 170px; text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="fee-rows-tbody"></tbody>
                </table>
            </div>
        </section>`);

        const addBtn = card.querySelector('#add-fee-row-btn');
        const editorWrap = card.querySelector('#fee-row-editor-wrap');
        const tbody = card.querySelector('#fee-rows-tbody');

        const renderTableBody = () => {
            tbody.innerHTML = '';
            if (!data.rows || !data.rows.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 24px;">No fee rows defined. Click "+ Add New Row" above to create one.</td></tr>`;
                return;
            }

            data.rows.forEach((row, idx) => {
                const tr = el(`<tr>
                    <td style="text-align: center; font-weight: 700; color: var(--muted);">${idx + 1}</td>
                    <td><strong>${H.esc(row.stage)}</strong></td>
                    <td>${H.esc(row.grades)}</td>
                    <td><span style="color: var(--navy); font-weight: 500;">${H.esc(row.details)}</span></td>
                    <td style="text-align: right;">
                        <div class="fee-row-actions" style="justify-content: flex-end;">
                            <button class="btn btn-ghost btn-sm move-up-btn" title="Move Up" ${idx === 0 ? 'disabled style="opacity:0.4;"' : ''}>▲</button>
                            <button class="btn btn-ghost btn-sm move-down-btn" title="Move Down" ${idx === data.rows.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>▼</button>
                            <button class="btn btn-ghost btn-sm edit-row-btn">Edit</button>
                            <button class="btn btn-danger btn-sm delete-row-btn">Delete</button>
                        </div>
                    </td>
                </tr>`);

                // Move Up
                tr.querySelector('.move-up-btn').addEventListener('click', async () => {
                    if (idx <= 0) return;
                    const temp = data.rows[idx - 1];
                    data.rows[idx - 1] = data.rows[idx];
                    data.rows[idx] = temp;
                    await saveRowsToServer();
                    renderTableBody();
                });

                // Move Down
                tr.querySelector('.move-down-btn').addEventListener('click', async () => {
                    if (idx >= data.rows.length - 1) return;
                    const temp = data.rows[idx + 1];
                    data.rows[idx + 1] = data.rows[idx];
                    data.rows[idx] = temp;
                    await saveRowsToServer();
                    renderTableBody();
                });

                // Edit
                tr.querySelector('.edit-row-btn').addEventListener('click', () => {
                    showRowEditor(row);
                });

                // Delete
                tr.querySelector('.delete-row-btn').addEventListener('click', async (e) => {
                    const btn = e.currentTarget;
                    if (btn.dataset.confirming) {
                        H.setBusy(btn, true);
                        try {
                            const res = await H.post(ENDPOINT, { action: 'delete_row', id: row.id });
                            if (!res.ok) throw new Error(res.message || 'Delete failed');
                            data = res.data;
                            H.toast('Row deleted');
                            renderTableBody();
                            if (editingRowId === row.id) hideRowEditor();
                        } catch (err) {
                            H.toast(err.message, 'error');
                        } finally {
                            H.setBusy(btn, false);
                        }
                    } else {
                        btn.dataset.confirming = 'true';
                        btn.textContent = 'Confirm?';
                        btn.classList.remove('btn-danger');
                        btn.classList.add('btn-secondary');
                        setTimeout(() => {
                            if (btn && document.body.contains(btn)) {
                                delete btn.dataset.confirming;
                                btn.textContent = 'Delete';
                                btn.classList.remove('btn-secondary');
                                btn.classList.add('btn-danger');
                            }
                        }, 3000);
                    }
                });

                tbody.appendChild(tr);
            });
        };

        const showRowEditor = (rowToEdit = null) => {
            editingRowId = rowToEdit ? rowToEdit.id : 0;
            editorWrap.hidden = false;
            editorWrap.innerHTML = `
                <div class="fee-modal-form">
                    <h4 style="margin: 0 0 12px; font-size: 15px; color: var(--navy);">
                        ${rowToEdit ? 'Edit Fee Row' : 'Add New Fee Row'}
                    </h4>
                    <form id="fee-single-row-form">
                        <div class="fee-form-row">
                            <div class="form-group" style="margin:0;">
                                <label for="row-stage" style="font-size:12px;">Stage Name *</label>
                                <input type="text" id="row-stage" required value="${H.esc(rowToEdit?.stage || '')}" placeholder="e.g. Primary">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label for="row-grades" style="font-size:12px;">Grades *</label>
                                <input type="text" id="row-grades" required value="${H.esc(rowToEdit?.grades || '')}" placeholder="e.g. I – V">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label for="row-details" style="font-size:12px;">Fee Details / Amount *</label>
                                <input type="text" id="row-details" required value="${H.esc(rowToEdit?.details || '')}" placeholder="e.g. ₹ 3,000 / month or Contact office">
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button type="submit" class="btn btn-primary btn-sm">
                                    <span class="btn-text">${rowToEdit ? 'Update' : 'Add Row'}</span>
                                    <span class="btn-spinner" hidden>●●●</span>
                                </button>
                                <button type="button" class="btn btn-ghost btn-sm cancel-row-btn">Cancel</button>
                            </div>
                        </div>
                    </form>
                </div>
            `;

            const form = editorWrap.querySelector('#fee-single-row-form');
            const submitBtn = form.querySelector('button[type="submit"]');

            editorWrap.querySelector('.cancel-row-btn').addEventListener('click', hideRowEditor);

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                H.setBusy(submitBtn, true);
                try {
                    const res = await H.post(ENDPOINT, {
                        action: 'save_row',
                        id: editingRowId,
                        stage: form.querySelector('#row-stage').value.trim(),
                        grades: form.querySelector('#row-grades').value.trim(),
                        details: form.querySelector('#row-details').value.trim(),
                    });
                    if (!res.ok) throw new Error(res.message || 'Failed to save row');
                    data = res.data;
                    H.toast(editingRowId ? 'Row updated' : 'Row added');
                    hideRowEditor();
                    renderTableBody();
                } catch (err) {
                    H.toast(err.message, 'error');
                } finally {
                    H.setBusy(submitBtn, false);
                }
            });

            editorWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        const hideRowEditor = () => {
            editingRowId = null;
            editorWrap.hidden = true;
            editorWrap.innerHTML = '';
        };

        const saveRowsToServer = async () => {
            try {
                const res = await H.post(ENDPOINT, {
                    action: 'save_rows',
                    rows: JSON.stringify(data.rows),
                });
                if (!res.ok) throw new Error(res.message || 'Failed to save row order');
                data = res.data;
                H.toast('Row order saved');
            } catch (err) {
                H.toast(err.message, 'error');
            }
        };

        addBtn.addEventListener('click', () => {
            showRowEditor(null);
        });

        renderTableBody();
        return card;
    }

    /* --------------------------------------------------------------------------
       3. Scholarship Box Card
       -------------------------------------------------------------------------- */
    function buildScholarshipCard() {
        const card = el(`<section class="fee-admin-card">
            <div class="fee-admin-card-head">
                <div>
                    <h3>Scholarship &amp; Financial Assistance Note</h3>
                    <p>Customize the highlight card shown below the fee table (Max Ultimate Scholarship Test / MUST).</p>
                </div>
            </div>
            <form id="fee-scholarship-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="sch-title">Scholarship Title</label>
                        <input type="text" id="sch-title" value="${H.esc(data.scholarship_title || '')}" placeholder="Max Ultimate Scholarship Test (MUST)">
                    </div>
                    <div class="form-group">
                        <label for="sch-btn-text">Button Text</label>
                        <input type="text" id="sch-btn-text" value="${H.esc(data.scholarship_btn_text || 'Enquire for Fee Schedule')}" placeholder="Enquire for Fee Schedule">
                    </div>
                    <div class="form-group">
                        <label for="sch-btn-link">Button Link URL</label>
                        <input type="text" id="sch-btn-link" value="${H.esc(data.scholarship_btn_link || 'contact-us.html#enquiry-form')}" placeholder="contact-us.html#enquiry-form">
                    </div>
                </div>
                <div class="form-group">
                    <label for="sch-desc">Scholarship Details</label>
                    <textarea id="sch-desc" rows="3" placeholder="Merit scholarships up to 100% in association with Physics Wallah Vidyapeeth...">${H.esc(data.scholarship_desc || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-sm">
                        <span class="btn-text">Save Scholarship Details</span>
                        <span class="btn-spinner" hidden>●●●</span>
                    </button>
                </div>
            </form>
        </section>`);

        const form = card.querySelector('#fee-scholarship-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            H.setBusy(submitBtn, true);
            try {
                const res = await H.post(ENDPOINT, {
                    action: 'save_general',
                    scholarship_title: form.querySelector('#sch-title').value.trim(),
                    scholarship_desc: form.querySelector('#sch-desc').value.trim(),
                    scholarship_btn_text: form.querySelector('#sch-btn-text').value.trim(),
                    scholarship_btn_link: form.querySelector('#sch-btn-link').value.trim(),
                });
                if (!res.ok) throw new Error(res.message || 'Save failed');
                data = res.data;
                H.toast('Scholarship details saved');
            } catch (err) {
                H.toast(err.message, 'error');
            } finally {
                H.setBusy(submitBtn, false);
            }
        });

        return card;
    }

    /* --------------------------------------------------------------------------
       4. Fee PDF Document Upload Card
       -------------------------------------------------------------------------- */
    function buildPdfCard() {
        const card = el(`<section class="fee-admin-card">
            <div class="fee-admin-card-head">
                <div>
                    <h3>Official Fee Structure Document (PDF)</h3>
                    <p>Optionally upload an official fee schedule booklet or PDF circular for parents to download.</p>
                </div>
            </div>
            <div id="fee-pdf-content"></div>
        </section>`);

        const container = card.querySelector('#fee-pdf-content');

        const paintPdfArea = () => {
            container.innerHTML = '';
            if (data.pdf_url) {
                const banner = el(`<div class="fee-pdf-banner">
                    <div class="fee-pdf-info">
                        <span class="pdf-icon">📄</span>
                        <div>
                            <strong>${H.esc(data.pdf_name || 'Fee-Structure.pdf')}</strong>
                            <span>Attached official fee prospectus</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <a href="${H.esc(data.pdf_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                            View PDF ↗
                        </a>
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer; margin:0;">
                            <span class="btn-text">Replace PDF</span>
                            <span class="btn-spinner" hidden>●●●</span>
                            <input type="file" accept="application/pdf" hidden>
                        </label>
                        <button type="button" class="btn btn-danger btn-sm remove-pdf-btn">
                            Remove
                        </button>
                    </div>
                </div>`);

                const fileInput = banner.querySelector('input[type="file"]');
                const replaceLabel = banner.querySelector('label');
                fileInput.addEventListener('change', () => handlePdfUpload(fileInput.files[0], replaceLabel));

                banner.querySelector('.remove-pdf-btn').addEventListener('click', async (e) => {
                    const btn = e.currentTarget;
                    H.setBusy(btn, true);
                    try {
                        const res = await H.post(ENDPOINT, { action: 'remove_pdf' });
                        if (!res.ok) throw new Error(res.message || 'Remove failed');
                        data = res.data;
                        H.toast('PDF removed');
                        paintPdfArea();
                    } catch (err) {
                        H.toast(err.message, 'error');
                    } finally {
                        H.setBusy(btn, false);
                    }
                });

                container.appendChild(banner);
            } else {
                const uploadBox = el(`<div style="border: 2px dashed var(--line); border-radius: var(--radius-sm); padding: 32px 20px; text-align: center; background: var(--bg);">
                    <div style="font-size: 34px; margin-bottom: 8px;">📑</div>
                    <strong style="display:block; color: var(--navy); margin-bottom: 4px;">No Fee PDF Uploaded</strong>
                    <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
                        Upload an official fee circular or booklet (Max 10 MB, PDF only).
                    </p>
                    <label class="btn btn-primary btn-sm" style="cursor: pointer; display: inline-flex;">
                        <span class="btn-text">Upload Fee PDF</span>
                        <span class="btn-spinner" hidden>●●●</span>
                        <input type="file" accept="application/pdf" hidden>
                    </label>
                </div>`);

                const fileInput = uploadBox.querySelector('input[type="file"]');
                const label = uploadBox.querySelector('label');
                fileInput.addEventListener('change', () => handlePdfUpload(fileInput.files[0], label));

                container.appendChild(uploadBox);
            }
        };

        const handlePdfUpload = async (file, btnElement) => {
            if (!file) return;
            if (file.type !== 'application/pdf') {
                H.toast('Please select a valid PDF file', 'error');
                return;
            }
            H.setBusy(btnElement, true);
            try {
                const fd = new FormData();
                fd.append('action', 'upload_pdf');
                fd.append('file', file);
                const res = await H.post(ENDPOINT, fd);
                if (!res.ok) throw new Error(res.message || 'Upload failed');
                data = res.data;
                H.toast('Fee structure PDF uploaded successfully');
                paintPdfArea();
            } catch (err) {
                H.toast(err.message, 'error');
            } finally {
                H.setBusy(btnElement, false);
            }
        };

        paintPdfArea();
        return card;
    }

    window.FeeAdmin = { render };
})();
