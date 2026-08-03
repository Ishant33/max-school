(() => {
  const module = document.body.dataset.cmsModule;
  if (!module) return;
  const target = document.querySelector('[data-cms-list]');
  if (!target) return;

  const safe = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  fetch(`/backend/cms_list.php?module=${encodeURIComponent(module)}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(items => {
      if (!items || !items.length) return;
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
