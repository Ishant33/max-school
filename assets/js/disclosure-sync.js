/* ==========================================================================
   Mandatory Public Disclosure — Client-side Dynamic Sync
   Fetches live data from backend/disclosure_list.php and dynamically updates
   mandatory-disclosure.html to ensure 100% parity with CMS updates.
   ========================================================================== */

(() => {
    'use strict';

    const esc = str => String(str == null ? '' : str)
        .replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));

    const pdfSvg = () => '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13.5h1.75a1.25 1.25 0 0 1 0 2.5H8.5v-2.5zm0-1.5H6.5v7h2v-2h1.75a2.75 2.75 0 0 0 0-5.5H8.5v.5zm4.5 7h-1.5v-7h2.2a2.5 2.5 0 0 1 2.5 2.5v2a2.5 2.5 0 0 1-2.5 2.5H13v-2.5v2.5zm0-5.5v4h.7a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H13zm5-1.5h3v1.5h-1.5v1.2h1.2v1.5h-1.2v2.8H18v-7z"/></svg>';

    const viewDocBtn = url => `<a class="cbse-link-btn" href="${esc(url)}" target="_blank" rel="noopener">${pdfSvg()}<span>VIEW DOCUMENT</span></a>`;
    const viewPdfBtn = url => `<a class="cbse-link-btn" href="${esc(url)}" target="_blank" rel="noopener">${pdfSvg()}<span>VIEW PDF</span></a>`;
    const officeSpan = '<span class="cbse-office-text">Available at school office</span>';

    fetch('backend/disclosure_list.php')
        .then(res => res.ok ? res.json() : Promise.reject('HTTP ' + res.status))
        .then(res => {
            if (!res || !res.ok || !res.data) return;
            syncPage(res.data);
        })
        .catch(err => {
            // Fail quietly — fallback static markup remains fully intact
            console.debug('Disclosure sync fallback to static:', err);
        });

    function syncPage(d) {
        // 1. Session badge in toolbar
        if (d.updated) {
            const tbNote = document.querySelector('.cbse-toolbar-note');
            if (tbNote) {
                let badge = tbNote.querySelector('.cbse-session-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'cbse-session-badge';
                    tbNote.appendChild(badge);
                }
                badge.textContent = 'Session ' + d.updated;
            }
        }

        // 2. Part A: General Information
        if (Array.isArray(d.general) && d.general.length > 0) {
            syncGeneral(d.general);
        }

        // 3. Part B: Documents & Information
        if (Array.isArray(d.documents) && d.documents.length > 0) {
            syncDocuments(d.documents);
        }

        // 4. Part C: Academics & Results
        syncAcademics(d.academics || [], d.results_x || [], d.results_xii || []);

        // 5. Part D: Staff
        syncStaff(d.staff || [], d.documents || [], d.general || []);

        // 6. Part E: Infrastructure facilities & specs
        syncInfrastructure(d.infrastructure || [], d.infrastructure_specs || []);
    }

    function syncGeneral(rows) {
        // Find Section A table tbody
        const secA = document.querySelector('#main-content .cbse-section-title, main .cbse-section-title');
        if (!secA) return;
        const tbl = secA.nextElementSibling ? secA.nextElementSibling.querySelector('table') : null;
        if (!tbl || !tbl.querySelector('tbody')) return;
        const tbody = tbl.querySelector('tbody');

        let html = '';
        let sNo = 0;
        rows.forEach(r => {
            const lbl = String(r.label || '').trim();
            const val = String(r.value || '').trim();
            if (!lbl && !val) return;
            sNo++;
            const isEmailOrUrl = lbl.toLowerCase().includes('email') || val.includes('@') || val.startsWith('http');
            const dispVal = isEmailOrUrl ? val : val.toUpperCase();
            html += `<tr><td class="col-sno">${sNo}</td><td class="col-info">${esc(lbl.toUpperCase())}</td><td>${esc(dispVal)}</td></tr>`;
        });
        if (html) {
            tbody.innerHTML = html;
        }
    }

    function syncDocuments(docs) {
        if (!Array.isArray(docs) || docs.length === 0) return;

        // Update Part B primary table
        const allSecTitles = document.querySelectorAll('.cbse-section-title');
        let secB = null;
        allSecTitles.forEach(st => {
            if (st.textContent.includes('B:') || st.textContent.includes('DOCUMENTS')) secB = st;
        });
        if (!secB) return;

        const tableWrap = secB.nextElementSibling;
        const tbody = tableWrap ? tableWrap.querySelector('tbody') : null;
        if (tbody) {
            let html = '';
            docs.forEach((d, idx) => {
                const title = String(d.title || '').trim() || ('Document #' + (idx + 1));
                const pdf = String(d.pdf_url || '').trim();
                const desc = String(d.description || '').trim();
                const rawSno = String(d.sno || '').trim();
                const sno = (rawSno && isNaN(Number(rawSno))) ? rawSno : (idx + 1);

                html += `<tr>
                    <td class="col-sno">${esc(sno)}</td>
                    <td>
                        ${esc(title.toUpperCase())}
                        ${desc ? `<div style="font-size:11.5px;color:#64748b;margin-top:2px;font-weight:normal;">${esc(desc)}</div>` : ''}
                    </td>
                    <td class="col-center">${pdf ? viewDocBtn(pdf) : officeSpan}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
        }

        // Ensure note box, appendix-meta, and additional documents are removed if present in DOM
        const appMeta = document.querySelector('.cbse-appendix-meta');
        if (appMeta) appMeta.remove();
        const noteBox = document.querySelector('.cbse-note-box');
        if (noteBox) noteBox.remove();
        document.querySelectorAll('.cbse-sub-section-title').forEach(t => {
            if (t.textContent.includes('ADDITIONAL STATUTORY') || t.textContent.includes('RELEVANT DOCUMENTS')) {
                const next = t.nextElementSibling;
                if (next && next.classList.contains('cbse-table-wrap')) next.remove();
                t.remove();
            }
        });
    }

    function syncAcademics(acads, resultsX, resultsXII) {
        // Update Part C primary table
        let secC = null;
        document.querySelectorAll('.cbse-section-title').forEach(st => {
            if (st.textContent.includes('C:') || st.textContent.includes('RESULT AND ACADEMICS')) secC = st;
        });
        if (!secC) return;
        const tableWrap = secC.nextElementSibling;
        const tbody = tableWrap ? tableWrap.querySelector('tbody') : null;
        if (tbody && Array.isArray(acads)) {
            let html = '';
            acads.forEach((a, idx) => {
                const label = String(a.label || '').trim() || ('Academic Item #' + (idx + 1));
                const val = String(a.value || '').trim();
                const pdf = String(a.pdf_url || '').trim();
                const rawSno = String(a.sno || '').trim();
                const sno = (rawSno && isNaN(Number(rawSno))) ? rawSno : (idx + 1);

                html += `<tr>
                    <td class="col-sno">${esc(sno)}</td>
                    <td>
                        ${esc(label.toUpperCase())}
                        ${val ? `<div style="font-size:11.5px;color:#64748b;margin-top:2px;font-weight:normal;">${esc(val)}</div>` : ''}
                    </td>
                    <td class="col-center">${pdf ? viewDocBtn(pdf) : officeSpan}</td>
                </tr>`;
            });
            html += `<tr><td class="col-sno">${acads.length + 1}</td><td>LAST THREE-YEAR RESULT OF THE BOARD EXAMINATION (AS PER APPLICABLILITY)</td><td class="col-center" style="font-weight:700;">AS DETAILED BELOW</td></tr>`;
            tbody.innerHTML = html;
        }

        // Clean up any stray additional academic tables from older DOM markup
        document.querySelectorAll('.cbse-sub-section-title').forEach(t => {
            if (t.textContent.includes('ADDITIONAL ACADEMIC')) {
                const next = t.nextElementSibling;
                if (next && next.classList.contains('cbse-table-wrap')) next.remove();
                t.remove();
            }
        });

        // Sync Class X & Class XII Result tables
        function updateResultTable(headerText, rows) {
            if (!Array.isArray(rows) || rows.length === 0) return;
            let targetHeader = null;
            document.querySelectorAll('.cbse-sub-section-title').forEach(t => {
                if (t.textContent.toUpperCase().includes(headerText)) {
                    targetHeader = t;
                }
            });
            if (!targetHeader) return;
            const wrap = targetHeader.nextElementSibling;
            if (!wrap) return;
            const tb = wrap.querySelector('tbody');
            if (!tb) return;
            tb.innerHTML = rows.map((r, idx) => `
                <tr>
                    <td class="col-sno">${esc(r.sno || (idx + 1))}</td>
                    <td class="col-center" style="font-weight:700;">${esc(r.year || '')}</td>
                    <td class="col-center">${esc(r.registered || '')}</td>
                    <td class="col-center">${esc(r.passed || '')}</td>
                    <td class="col-center" style="font-weight:700;">${esc(r.pct || '')}</td>
                    <td class="col-center">
                        ${r.pdf ? viewPdfBtn(r.pdf) : '<span class="cbse-office-text">-</span>'}
                    </td>
                </tr>
            `).join('');
        }
        if (Array.isArray(resultsX) && resultsX.length > 0) {
            updateResultTable('RESULT CLASS: X', resultsX);
        }
        if (Array.isArray(resultsXII) && resultsXII.length > 0) {
            updateResultTable('RESULT CLASS: XII', resultsXII);
        }
    }

    function syncStaff(staffRows, docs, generalRows) {
        let prinName = 'MS. SONIKA RAI, M.A., B.Ed.';
        if (Array.isArray(generalRows)) {
            generalRows.forEach(g => {
                const l = String(g.label || '').toLowerCase();
                if (l.includes('principal name') && g.value) {
                    prinName = g.value;
                }
            });
        }

        let staffListPdf = 'backend/uploads/disclosure/b/9.pdf';
        docs.forEach(d => {
            if (parseInt(d.id, 10) === 9 || String(d.title || '').toLowerCase().includes('staff detail')) {
                if (d.pdf_url) staffListPdf = d.pdf_url;
            }
        });

        let secD = null;
        document.querySelectorAll('.cbse-section-title').forEach(st => {
            if (st.textContent.includes('D:') || st.textContent.includes('STAFF')) secD = st;
        });
        if (!secD) return;
        const tableWrap = secD.nextElementSibling;
        const tbody = tableWrap ? tableWrap.querySelector('tbody') : null;
        if (!tbody) return;

        let html = '';
        let sNo = 0;
        (staffRows || []).forEach(st => {
            const lbl = String(st.label || '').trim();
            const val = String(st.value || '').trim();
            if (!lbl && !val) return;
            const k = lbl.toLowerCase();
            const isSubLevel = ['pgt', 'tgt', 'prt', 'ntt', 'pet'].includes(k) || lbl.startsWith('▪');

            if (isSubLevel) {
                const subName = lbl.replace(/^[▪\s]+/, '');
                html += `<tr class="sub-level"><td></td><td class="indent-sub">▪ ${esc(subName.toUpperCase())}</td><td class="col-center">${esc(val)}</td><td><a href="${esc(staffListPdf)}" target="_blank" rel="noopener" class="cbse-text-link">NAME-DESIGNATION -QUALIFICATION (PROVIDE LINK)</a></td></tr>`;
            } else {
                sNo++;
                let colStrength = '-';
                let colDetails = '-';

                if (k === 'principal') {
                    colStrength = (val && val !== '0') ? val : '1';
                    colDetails = esc(prinName.toUpperCase());
                } else if (k === 'vice principal') {
                    colStrength = val;
                    colDetails = (val !== '0' && val !== '-') ? esc(val) : '-';
                } else if (k.includes('headmaster') || k.includes('headmistress')) {
                    colStrength = val;
                    colDetails = val !== '-' ? esc(val) : '-';
                } else if (k.includes('total') && k.includes('teacher')) {
                    colStrength = val;
                    colDetails = `<a href="${esc(staffListPdf)}" target="_blank" rel="noopener" class="cbse-link-btn">${pdfSvg()}<span>UPLOAD LIST/DETAILS</span></a>`;
                } else if (k.includes('ratio')) {
                    colStrength = val;
                    colDetails = '-';
                } else if (k.includes('special educator')) {
                    colStrength = '1';
                    colDetails = esc(val.toUpperCase());
                } else if (k.includes('counsellor') || k.includes('wellness')) {
                    colStrength = '1';
                    colDetails = esc(val.toUpperCase());
                } else {
                    if (!isNaN(Number(val)) && val !== '') {
                        colStrength = val;
                        colDetails = '-';
                    } else {
                        colStrength = '-';
                        colDetails = esc(val.toUpperCase());
                    }
                }

                html += `<tr><td class="col-sno">${sNo}.</td><td class="col-info">${esc(lbl.toUpperCase())}</td><td class="col-center">${esc(colStrength)}</td><td>${colDetails}</td></tr>`;
            }
        });

        if (html) {
            tbody.innerHTML = html;
        }
    }

    function syncInfrastructure(facilities, specs) {
        let secE = null;
        document.querySelectorAll('.cbse-section-title').forEach(st => {
            if (st.textContent.includes('E:') || st.textContent.includes('INFRASTRUCTURE')) secE = st;
        });
        if (!secE) return;

        const tableWrap = secE.nextElementSibling;
        if (!tableWrap) return;

        // Sync 9 CBSE Infrastructure Specifications
        if (Array.isArray(specs) && specs.length > 0) {
            const tbody = tableWrap.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = specs.map(s => {
                    const val = String(s.value || '').trim();
                    const isLink = val.startsWith('http://') || val.startsWith('https://') || String(s.label || '').toLowerCase().includes('video') || String(s.label || '').toLowerCase().includes('youtube');
                    return `<tr>
                        <td class="col-sno">${esc(s.sno || '')}</td>
                        <td class="col-info">${esc(String(s.label || '').toUpperCase())}</td>
                        <td>${isLink && val ? `<a href="${esc(val)}" target="_blank" rel="noopener" class="cbse-text-link">PROVIDE LINK (WATCH VIDEO)</a>` : esc(val)}</td>
                    </tr>`;
                }).join('');
            }
        }

        // Ensure campus facilities pills and title are removed if present in DOM
        const grid = document.querySelector('.cbse-facilities-grid');
        if (grid) grid.remove();
        document.querySelectorAll('.cbse-sub-section-title').forEach(t => {
            if (t.textContent.includes('CAMPUS FACILITIES')) {
                t.remove();
            }
        });
    }
})();
