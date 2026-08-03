(() => {
  const modules = { about: 'About Us', academics: 'Academics', admission: 'Admission', career: 'Career', gallery: 'Gallery' };
  let currentModule = 'about'; let editing = null;
  const $ = selector => document.querySelector(selector);
  const message = (text, target = '#app-message') => { const el = $(target); el.textContent = text; el.hidden = !text; };
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function checkSession() {
    const res = await fetch('/backend/session.php');
    const json = await res.json();
    const logged = json.logged;
    $('#login-view').hidden = logged;
    $('#app-view').hidden = !logged;
    $('#sign-out').hidden = !logged;
    if (logged) render();
  }

  async function render() {
    const res = await fetch(`/backend/cms_admin.php?action=list&module=${encodeURIComponent(currentModule)}`, { credentials: 'same-origin' });
    if (!res.ok) { message('Error loading items'); return; }
    const json = await res.json();
    const data = json.data || [];
    const list = $('#content-list');
    list.innerHTML = data.length ? data.map(item => `<article class="content-item"><div>${item.image_url ? `<img src="${esc(item.image_url)}" alt="">` : ''}<h3>${esc(item.title)} ${!item.is_published ? '<em>Draft</em>' : ''}</h3><p>${esc(item.body).replace(/\n/g, '<br>')}</p></div><div class="item-actions"><a href="#" data-edit="${item.id}">Edit</a><form data-delete="${item.id}"><button>Delete</button></form></div></article>`).join('') : '<p class="empty">No items yet.</p>';
    list.querySelectorAll('[data-edit]').forEach(link => link.onclick = event => { event.preventDefault(); edit(data.find(item => item.id === Number(link.dataset.edit))); });
    list.querySelectorAll('[data-delete]').forEach(form => form.onsubmit = event => { event.preventDefault(); remove(Number(form.dataset.delete)); });
  }

  function reset() { editing = null; $('#content-form').reset(); $('#published').checked = true; $('#sort-order').value = 0; $('#editor-title').textContent = 'Add item'; $('#cancel-edit').hidden = true; message(''); }
  function edit(item) { editing = item.id; $('#content-id').value = item.id; $('#content-title').value = item.title; $('#content-body').value = item.body || ''; $('#image-url').value = item.image_url || ''; $('#sort-order').value = item.sort_order; $('#published').checked = item.is_published; $('#editor-title').textContent = 'Edit item'; $('#cancel-edit').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function remove(id) { if (!confirm('Delete this item?')) return; const form = new FormData(); form.append('action','delete'); form.append('id', id); const res = await fetch('/backend/cms_admin.php', { method: 'POST', body: form, credentials: 'same-origin' }); const json = await res.json(); if (!json.ok) message(json.message || 'Error'); else render(); }

  async function upload(file) { if (!file) return null; if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Upload a JPG, PNG, or WebP image smaller than 5 MB.'); const fd = new FormData(); fd.append('action','upload'); fd.append('file', file); const res = await fetch('/backend/cms_admin.php', { method: 'POST', body: fd, credentials: 'same-origin' }); const json = await res.json(); if (!json.ok) throw new Error(json.message || 'Upload failed'); return json.url; }

  $('#login-form').onsubmit = async event => {
    event.preventDefault(); message('', '#login-message');
    const fd = new FormData(); fd.append('email', $('#email').value); fd.append('password', $('#password').value);
    const res = await fetch('/backend/login.php', { method: 'POST', body: fd, credentials: 'same-origin' });
    if (!res.ok) { message('Invalid credentials', '#login-message'); return; }
    checkSession();
  };

  $('#sign-out').onclick = async () => { await fetch('/backend/logout.php', { method: 'POST', credentials: 'same-origin' }); checkSession(); };

  $('#content-form').onsubmit = async event => { event.preventDefault(); message(''); try { const file = $('#image-file').files[0]; const imageUrl = file ? await upload(file) : ($('#image-url').value.trim() || null); const form = new FormData(); form.append('action', editing ? 'update' : 'insert'); if (editing) form.append('id', editing); form.append('module', currentModule); form.append('title', $('#content-title').value.trim()); form.append('body', $('#content-body').value.trim()); if (imageUrl) form.append('image_url', imageUrl); form.append('sort_order', Number($('#sort-order').value) || 0); form.append('is_published', $('#published').checked ? '1' : ''); const res = await fetch('/backend/cms_admin.php', { method: 'POST', body: form, credentials: 'same-origin' }); const json = await res.json(); if (!json.ok) throw new Error(json.message || 'Save failed'); reset(); render(); } catch (error) { message(error.message); } };

  $('#cancel-edit').onclick = event => { event.preventDefault(); reset(); };
  document.querySelectorAll('[data-module]').forEach(link => link.onclick = event => { event.preventDefault(); currentModule = link.dataset.module; $('#module-title').textContent = modules[currentModule]; document.querySelectorAll('[data-module]').forEach(a => a.classList.toggle('selected', a === link)); reset(); render(); });

  checkSession();
})();
