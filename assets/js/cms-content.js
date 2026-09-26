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

        let url = `backend/cms_list.php?module=${encodeURIComponent(module)}`;
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

    // Render Homepage Running Marquee Ticker if present
    const marqueeSection = document.querySelector('.gc-marquee-section');
    if (marqueeSection) {
        fetch('backend/cms_list.php?module=ticker')
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(items => {
                if (!items || !items.length) return;
                const contentHtml = items.map(item => `<span>${esc(item.title)}</span><span class="star">✦</span>`).join('');
                const tracks = marqueeSection.querySelectorAll('.gc-marquee-content');
                if (tracks.length >= 2) {
                    tracks[0].innerHTML = contentHtml;
                    tracks[1].innerHTML = contentHtml;
                } else {
                    const track = marqueeSection.querySelector('.gc-marquee-track');
                    if (track) {
                        track.innerHTML = `<div class="gc-marquee-content">${contentHtml}</div><div class="gc-marquee-content">${contentHtml}</div>`;
                    }
                }
            })
            .catch(() => {});
    }

    // Render Leadership Messages (Chairperson, Director, Principal)
    const chairCard = document.getElementById('chairperson');
    const dirCard = document.getElementById('director');
    const prinCard = document.getElementById('principal');
    const leaderCards = document.querySelectorAll('.gc-leader-card');

    if (chairCard || dirCard || prinCard || (leaderCards && leaderCards.length > 0)) {
        fetch('backend/leadership_list.php')
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(res => {
                if (!res || !res.ok || !res.data) return;
                const d = res.data;

                // Update about-us.html cards
                const updateLeaderMsg = (card, data) => {
                    if (!card || !data) return;
                    const img = card.querySelector('.msg-photo img');
                    if (img && data.image_url) {
                        img.src = data.image_url;
                        img.alt = `${data.name || ''}, ${data.role || ''}`;
                    }
                    const roleEl = card.querySelector('.role');
                    if (roleEl && data.role) roleEl.textContent = data.role;
                    const nameEl = card.querySelector('h3');
                    if (nameEl && data.name) nameEl.textContent = data.name;
                    const quoteEl = card.querySelector('blockquote');
                    if (quoteEl) {
                        if (data.quote && data.quote.trim()) {
                            quoteEl.textContent = `"${data.quote.replace(/^["']|["']$/g, '').trim()}"`;
                            quoteEl.style.display = '';
                        } else {
                            quoteEl.style.display = 'none';
                        }
                    }
                    if (Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
                        const existingPs = card.querySelectorAll('.msg-body > p');
                        existingPs.forEach(p => p.remove());
                        const signEl = card.querySelector('.sign');
                        data.paragraphs.forEach(text => {
                            if (!text || !text.trim()) return;
                            const p = document.createElement('p');
                            p.textContent = text;
                            if (signEl) card.querySelector('.msg-body').insertBefore(p, signEl);
                            else card.querySelector('.msg-body').appendChild(p);
                        });
                    }
                    const signEl = card.querySelector('.sign');
                    if (signEl && data.sign) signEl.textContent = data.sign;
                };

                updateLeaderMsg(chairCard, d.chairperson);
                updateLeaderMsg(dirCard, d.director);
                updateLeaderMsg(prinCard, d.principal);

                // Update index.html homepage leader cards if present
                if (leaderCards && leaderCards.length >= 3) {
                    const keys = ['chairperson', 'director', 'principal'];
                    leaderCards.forEach((card, idx) => {
                        const item = d[keys[idx]];
                        if (!item) return;
                        const img = card.querySelector('.gc-leader-img-box img');
                        if (img && item.image_url) {
                            img.src = item.image_url;
                            img.alt = `${item.name}, ${item.role}`;
                        }
                        const nameEl = card.querySelector('.gc-leader-info h4');
                        if (nameEl && item.name) nameEl.textContent = item.name;
                        const desigEl = card.querySelector('.gc-leader-info .designation');
                        if (desigEl && item.role) {
                            desigEl.textContent = item.role.replace(/^Message from the\s+/i, '');
                        }
                    });
                }
            })
            .catch(() => {});
    }
})();
