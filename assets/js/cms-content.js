(() => {
  const module = document.body.dataset.cmsModule;
  if (!module) return;
  const target = document.querySelector('[data-cms-list]');
  if (!target) return;

  const safe = value => String(value || '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
  const client = window.cmsSupabase;
  if (!client) return;
  client.from('cms_content').select('title, body, image_url').eq('module', module).eq('is_published', true).order('sort_order').order('id', { ascending: false })
    .then(({ data: items, error }) => {
      if (error || !items || !items.length) return;
      target.innerHTML = items.map(item => {
        const title = safe(item.title);
        const body = safe(item.body).replace(/\n/g, '<br>');
        if (module === 'gallery') return `<div class="gallery-tile cms-gallery-item">${item.image_url ? `<img src="${safe(item.image_url)}" alt="${title}">` : ''}<span>${title}</span></div>`;
        if (module === 'career') return `<div class="job-row"><div><h4>${title}</h4><span>${body}</span></div><span class="tag">Apply</span></div>`;
        return `<article class="feature-card"><h3>${title}</h3><p>${body}</p></article>`;
      }).join('');
    })
    .catch(() => {});
})();
