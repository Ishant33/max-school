/* ==========================================================================
   Max International School — Public CMS Rendering
   Generalized for multiple feeds per page and module-specific card rendering.
   ========================================================================== */

(() => {
    'use strict';

    const esc = value => String(value == null ? '' : value)
        .replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));

    // Render each [data-cms-list] independently
    document.querySelectorAll('[data-cms-list]').forEach(container => {
        const module = container.dataset.cmsList || document.body.dataset.cmsModule;
        if (!module) return;

        const limit = container.dataset.cmsLimit ? parseInt(container.dataset.cmsLimit, 10) : 0;

        let url = `/backend/cms_list.php?module=${encodeURIComponent(module)}`;
        if (limit > 0) url += `&limit=${limit}`;

        fetch(url)
            .then(res => res.ok ? res.json() : Promise.reject('Network error'))
            .then(items => {
                if (!items || !items.length) {
                    container.innerHTML = '<p class="cms-empty">No items published yet.</p>';
                    return;
                }
                container.innerHTML = items.map(item => renderItem(item, module)).join('');
            })
            .catch(err => {
                console.error('CMS load error:', err);
                container.innerHTML = '<p class="cms-error">Could not load content.</p>';
            });
    });

    function renderItem(item, module) {
        const title = esc(item.title);
        const body = esc(item.body).replace(/\n/g, '<br>');
        const imageUrl = esc(item.image_url || '');
        const linkUrl = esc(item.link_url || '');
        const coverUrl = esc(item.cover_url || '');
        const badge = esc(item.badge || '');

        switch (module) {
            case 'gallery':
                return `<div class="gallery-tile cms-gallery-item">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" loading="lazy">` : ''}
                    <span>${title}</span>
                </div>`;

            case 'career':
                return `<div class="job-row">
                    <div>
                        <h4>${title}</h4>
                        <span>${body}</span>
                    </div>
                    ${badge ? `<span class="tag">${badge}</span>` : '<span class="tag">Apply</span>'}
                </div>`;

            case 'newsletters': {
                const thumb = coverUrl || imageUrl;
                const icon = thumb ? '' : '<span class="newsletter-icon">📰</span>';
                const btnText = linkUrl.toLowerCase().endsWith('.pdf') ? 'Download PDF' : 'View Newsletter';
                return `<article class="newsletter-card">
                    ${thumb ? `<img src="${thumb}" alt="${title}" class="newsletter-cover" loading="lazy">` : icon}
                    <div class="newsletter-content">
                        <h3 class="newsletter-title">${title}</h3>
                        ${body ? `<p class="newsletter-excerpt">${body}</p>` : ''}
                        ${linkUrl ? `<a href="${linkUrl}" class="btn btn-navy" target="_blank" rel="noopener">${btnText}</a>` : ''}
                    </div>
                </article>`;
            }

            case 'notifications':
                return `<div class="job-row notification-card">
                    <div>
                        ${badge ? `<span class="notification-badge">${badge}</span>` : ''}
                        <h4>${title}</h4>
                        <span>${body}</span>
                    </div>
                    ${linkUrl ? `<a href="${linkUrl}" class="tag" target="_blank" rel="noopener">Details</a>` : ''}
                </div>`;

            case 'about':
            case 'academics':
            case 'admission':
            case 'beyond':
            case 'promax':
            default:
                return `<article class="feature-card">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="feature-image" loading="lazy">` : ''}
                    <div class="feature-content">
                        <h3>${title}</h3>
                        ${body ? `<p>${body}</p>` : ''}
                    </div>
                </article>`;
        }
    }

    // Render Fee Structure on Admission page if present
    const feeTableBody = document.getElementById('fee-table-body');
    if (feeTableBody) {
        fetch('backend/fee_list.php')
            .then(res => res.ok ? res.json() : Promise.reject('Network error'))
            .then(res => {
                if (!res || !res.ok || !res.data) return;
                const feeData = res.data;

                // Update table rows if defined
                if (Array.isArray(feeData.rows) && feeData.rows.length > 0) {
                    feeTableBody.innerHTML = feeData.rows.map(row => `
                        <tr>
                            <td>${esc(row.stage)}</td>
                            <td>${esc(row.grades)}</td>
                            <td>${esc(row.details)}</td>
                        </tr>
                    `).join('');
                }

                // Update section headers if customized
                const eyebrowEl = document.getElementById('fee-eyebrow');
                if (eyebrowEl && feeData.eyebrow) eyebrowEl.textContent = feeData.eyebrow;

                const titleEl = document.getElementById('fee-title');
                if (titleEl && feeData.title) titleEl.textContent = feeData.title;

                const descEl = document.getElementById('fee-description');
                if (descEl && feeData.description) descEl.textContent = feeData.description;

                // Update scholarship box if present
                const schTitle = document.getElementById('fee-scholarship-title');
                if (schTitle && feeData.scholarship_title) schTitle.textContent = feeData.scholarship_title;

                const schDesc = document.getElementById('fee-scholarship-desc');
                if (schDesc && feeData.scholarship_desc) schDesc.textContent = feeData.scholarship_desc;

                const schBtn = document.getElementById('fee-scholarship-btn');
                if (schBtn) {
                    if (feeData.scholarship_btn_text) schBtn.textContent = feeData.scholarship_btn_text;
                    if (feeData.scholarship_btn_link) schBtn.href = feeData.scholarship_btn_link;
                }

                // PDF Download button if uploaded
                const actionsWrap = document.getElementById('fee-actions-wrap');
                if (actionsWrap && feeData.pdf_url) {
                    let pdfBtn = document.getElementById('fee-pdf-download-btn');
                    if (!pdfBtn) {
                        pdfBtn = document.createElement('a');
                        pdfBtn.id = 'fee-pdf-download-btn';
                        pdfBtn.className = 'btn btn-navy';
                        pdfBtn.target = '_blank';
                        pdfBtn.rel = 'noopener noreferrer';
                        actionsWrap.appendChild(pdfBtn);
                    }
                    pdfBtn.href = feeData.pdf_url;
                    pdfBtn.innerHTML = '📄 Download Fee Schedule (PDF)';
                }
            })
            .catch(() => {
                // Static HTML fallback remains visible
            });
    }
})();
