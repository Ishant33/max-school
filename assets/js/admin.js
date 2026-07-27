(() => {
  const client = window.cmsSupabase;
  const modules = { about: 'About Us', academics: 'Academics', admission: 'Admission', career: 'Career', gallery: 'Gallery' };
  let currentModule = 'about'; let editing = null;
  const $ = selector => document.querySelector(selector);
  const message = (text, target = '#app-message') => { const el = $(target); el.textContent = text; el.hidden = !text; };
  const esc = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  if (!client) { message('Add your Supabase URL and publishable key to assets/js/supabase-config.js.', '#login-message'); return; }

  async function render() {
    const { data, error } = await client.from('cms_content').select('*').eq('module', currentModule).order('sort_order').order('id', { ascending: false });
    if (error) return message(error.message);
    const list = $('#content-list');
    list.innerHTML = data.length ? data.map(item => `<article class="content-item"><div>${item.image_url ? `<img src="${esc(item.image_url)}" alt="">` : ''}<h3>${esc(item.title)} ${!item.is_published ? '<em>Draft</em>' : ''}</h3><p>${esc(item.body).replace(/\n/g, '<br>')}</p></div><div class="item-actions"><a href="#" data-edit="${item.id}">Edit</a><form data-delete="${item.id}"><button>Delete</button></form></div></article>`).join('') : '<p class="empty">No items yet.</p>';
    list.querySelectorAll('[data-edit]').forEach(link => link.onclick = event => { event.preventDefault(); edit(data.find(item => item.id === Number(link.dataset.edit))); });
    list.querySelectorAll('[data-delete]').forEach(form => form.onsubmit = event => { event.preventDefault(); remove(Number(form.dataset.delete)); });
  }
  function reset() { editing = null; $('#content-form').reset(); $('#published').checked = true; $('#sort-order').value = 0; $('#editor-title').textContent = 'Add item'; $('#cancel-edit').hidden = true; message(''); }
  function edit(item) { editing = item.id; $('#content-id').value = item.id; $('#content-title').value = item.title; $('#content-body').value = item.body || ''; $('#image-url').value = item.image_url || ''; $('#sort-order').value = item.sort_order; $('#published').checked = item.is_published; $('#editor-title').textContent = 'Edit item'; $('#cancel-edit').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function remove(id) { if (!confirm('Delete this item?')) return; const { error } = await client.from('cms_content').delete().eq('id', id); if (error) message(error.message); else render(); }
  async function upload(file) { if (!file) return null; if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Upload a JPG, PNG, or WebP image smaller than 5 MB.'); const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9._-]/gi, '-')}`; const { error } = await client.storage.from('gallery').upload(path, file, { cacheControl: '3600', upsert: false }); if (error) throw error; return client.storage.from('gallery').getPublicUrl(path).data.publicUrl; }
  $('#login-form').onsubmit = async event => { event.preventDefault(); message('', '#login-message'); const { error } = await client.auth.signInWithPassword({ email: $('#email').value, password: $('#password').value }); if (error) message(error.message, '#login-message'); };
  $('#sign-out').onclick = () => client.auth.signOut();
  $('#content-form').onsubmit = async event => { event.preventDefault(); message(''); try { const imageUrl = await upload($('#image-file').files[0]) || $('#image-url').value.trim(); const row = { module: currentModule, title: $('#content-title').value.trim(), body: $('#content-body').value.trim(), image_url: imageUrl || null, sort_order: Number($('#sort-order').value) || 0, is_published: $('#published').checked }; const result = editing ? await client.from('cms_content').update(row).eq('id', editing) : await client.from('cms_content').insert(row); if (result.error) throw result.error; reset(); render(); } catch (error) { message(error.message); } };
  $('#cancel-edit').onclick = event => { event.preventDefault(); reset(); };
  document.querySelectorAll('[data-module]').forEach(link => link.onclick = event => { event.preventDefault(); currentModule = link.dataset.module; $('#module-title').textContent = modules[currentModule]; document.querySelectorAll('[data-module]').forEach(a => a.classList.toggle('selected', a === link)); reset(); render(); });
  client.auth.onAuthStateChange((_event, session) => { $('#login-view').hidden = !!session; $('#app-view').hidden = !session; $('#sign-out').hidden = !session; if (session) render(); });
  client.auth.getSession().then(({ data: { session } }) => { $('#login-view').hidden = !!session; $('#app-view').hidden = !session; $('#sign-out').hidden = !session; if (session) render(); });
})();
