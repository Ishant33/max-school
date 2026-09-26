/* ==========================================================================
   Leadership Messages — CMS Screen
   Exposed as window.LeadershipAdmin.render(mount, helpers); admin.js calls
   this when the Leadership Messages module is selected.
   ========================================================================== */

(() => {
    'use strict';

    let H = null; // helpers passed from admin.js: api, post, toast, esc, setBusy
    let mount = null;
    let data = null;

    const ENDPOINT = 'leadership_admin.php';

    const el = (html) => {
        const tpl = document.createElement('template');
        tpl.innerHTML = html.trim();
        return tpl.content.firstElementChild;
    };

    async function render(mountNode, helpers) {
        mount = mountNode;
        H = helpers;
        mount.innerHTML = '<div class="loading-state">Loading leadership messages…</div>';

        try {
            const json = await H.api(`${ENDPOINT}?action=get`);
            if (!json.ok) throw new Error(json.message || 'Could not load leadership data');
            data = json.data || {};
            paint();
        } catch (error) {
            mount.innerHTML = `<div class="empty-state">
                <strong>Could not load leadership messages</strong>
                ${H.esc(error.message)}
            </div>`;
        }
    }

    function paint() {
        mount.innerHTML = '';
        mount.className = 'fee-admin-screen leadership-admin-screen';

        const leaders = [
            {
                key: 'chairperson',
                title: "🏛️ Chairperson's Message",
                desc: 'Configure the message from the Chairperson shown on the About Us page.',
                defaultRole: 'Message from the Chairperson',
                defaultName: 'CA Mukesh Bansal'
            },
            {
                key: 'director',
                title: "💼 Director's Message",
                desc: 'Configure the message from the Director shown on the About Us page.',
                defaultRole: 'Message from the Director',
                defaultName: 'Mr. Kapil Gupta'
            },
            {
                key: 'principal',
                title: "🎓 Principal's Message",
                desc: 'Configure the message from the Principal shown on the About Us page.',
                defaultRole: 'Message from the Principal',
                defaultName: 'Ms. Sonika Rai'
            }
        ];

        leaders.forEach(cfg => {
            mount.appendChild(buildLeaderCard(cfg));
        });
    }

    function buildLeaderCard(cfg) {
        const item = data[cfg.key] || {};
        const paras = Array.isArray(item.paragraphs) ? item.paragraphs.join('\n\n') : (item.paragraphs || '');
        const photoUrl = item.image_url || '';

        const card = el(`<section class="fee-admin-card" style="margin-bottom: 24px;">
            <div class="fee-admin-card-head">
                <div>
                    <h3>${cfg.title}</h3>
                    <p>${cfg.desc}</p>
                </div>
            </div>
            <form id="form-${cfg.key}" style="padding: 16px 20px;">
                <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px;">
                    <!-- Photo preview and upload -->
                    <div style="flex: 0 0 160px; text-align: center;">
                        <div style="width: 140px; height: 160px; border-radius: 8px; border: 2px dashed var(--line); overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                            <img id="preview-${cfg.key}" src="${photoUrl ? H.esc(photoUrl) : ''}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: ${photoUrl ? 'block' : 'none'};">
                            <span id="placeholder-${cfg.key}" style="color: var(--muted); font-size: 13px; display: ${photoUrl ? 'none' : 'block'};">No photo</span>
                        </div>
                        <input type="hidden" id="photo-url-${cfg.key}" value="${H.esc(photoUrl)}">
                        <label class="btn btn-secondary btn-sm" style="display: inline-block; cursor: pointer;">
                            <span class="btn-text">Upload Photo</span>
                            <span class="btn-spinner" hidden>●●●</span>
                            <input type="file" id="file-${cfg.key}" accept="image/jpeg,image/png,image/webp" style="display: none;">
                        </label>
                    </div>

                    <!-- Leader details -->
                    <div style="flex: 1; min-width: 280px;">
                        <div class="form-row">
                            <div class="form-group" style="flex: 1;">
                                <label for="name-${cfg.key}">Leader Full Name *</label>
                                <input type="text" id="name-${cfg.key}" required value="${H.esc(item.name || cfg.defaultName)}" placeholder="${cfg.defaultName}">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label for="role-${cfg.key}">Designation / Card Title *</label>
                                <input type="text" id="role-${cfg.key}" required value="${H.esc(item.role || cfg.defaultRole)}" placeholder="${cfg.defaultRole}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="quote-${cfg.key}">Highlight Quote (Optional)</label>
                            <input type="text" id="quote-${cfg.key}" value="${H.esc(item.quote || '')}" placeholder='e.g. "Nothing is more beautiful than trust..."'>
                        </div>

                        <div class="form-group">
                            <label for="sign-${cfg.key}">Sign-off Line</label>
                            <input type="text" id="sign-${cfg.key}" value="${H.esc(item.sign || '')}" placeholder="— ${H.esc(item.name || cfg.defaultName)}">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="msg-${cfg.key}">Message Content (Paragraphs separated by an empty line) *</label>
                    <textarea id="msg-${cfg.key}" rows="5" required placeholder="Write the message paragraphs here...">${H.esc(paras)}</textarea>
                </div>

                <div class="form-actions" style="margin-top: 14px; text-align: right;">
                    <button type="submit" class="btn btn-primary btn-sm">
                        <span class="btn-text">Save ${H.esc(item.name || cfg.defaultName)}'s Message</span>
                        <span class="btn-spinner" hidden>●●●</span>
                    </button>
                </div>
            </form>
        </section>`);

        const form = card.querySelector(`#form-${cfg.key}`);
        const submitBtn = form.querySelector('button[type="submit"]');
        const fileInput = form.querySelector(`#file-${cfg.key}`);
        const previewImg = form.querySelector(`#preview-${cfg.key}`);
        const placeholder = form.querySelector(`#placeholder-${cfg.key}`);
        const photoUrlInput = form.querySelector(`#photo-url-${cfg.key}`);

        // Handle photo upload
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const uploadLabel = fileInput.closest('label');
            H.setBusy(uploadLabel, true);

            try {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('kind', 'image');

                const res = await H.post(`${ENDPOINT}?action=upload`, fd);
                if (!res.ok) throw new Error(res.message || 'Photo upload failed');

                photoUrlInput.value = res.url;
                previewImg.src = res.url;
                previewImg.style.display = 'block';
                placeholder.style.display = 'none';

                H.toast('Photo uploaded successfully! Remember to save the message.');
            } catch (err) {
                H.toast('Upload error: ' + err.message, 'error');
            } finally {
                H.setBusy(uploadLabel, false);
                fileInput.value = '';
            }
        });

        // Handle form save
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            H.setBusy(submitBtn, true);

            try {
                const res = await H.post(ENDPOINT, {
                    action: 'save_leader',
                    leader_key: cfg.key,
                    name: form.querySelector(`#name-${cfg.key}`).value.trim(),
                    role: form.querySelector(`#role-${cfg.key}`).value.trim(),
                    quote: form.querySelector(`#quote-${cfg.key}`).value.trim(),
                    sign: form.querySelector(`#sign-${cfg.key}`).value.trim(),
                    image_url: photoUrlInput.value.trim(),
                    message: form.querySelector(`#msg-${cfg.key}`).value.trim()
                });

                if (!res.ok) throw new Error(res.message || 'Could not save message');
                data[cfg.key] = res.data;
                H.toast(`${form.querySelector(`#name-${cfg.key}`).value.trim()}’s message saved successfully!`);
            } catch (err) {
                H.toast('Save failed: ' + err.message, 'error');
            } finally {
                H.setBusy(submitBtn, false);
            }
        });

        return card;
    }

    window.LeadershipAdmin = { render };
})();
