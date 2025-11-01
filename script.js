(function () {
  const app = document.getElementById('app') || document.body;
  let listEl = document.getElementById('list');
  let viewer = document.getElementById('viewer');
  if (!listEl || !viewer) {
    const main = document.createElement('main'); main.className = 'layout';
    listEl = document.createElement('aside'); listEl.id = 'list';
    viewer = document.createElement('article'); viewer.id = 'viewer';
    main.appendChild(listEl); main.appendChild(viewer);
    app.appendChild(main);
  }

  const data = Array.isArray(window.FF_DATA) ? window.FF_DATA : [];
  if (!data.length) { viewer.textContent = 'Nessun capitolo trovato.'; return; }

  function buildURL(p) { return new URL(encodeURI(p), document.baseURI).toString(); }

  const groups = {};
  for (const it of data) {
    const f = it.fandom || 'Misc'; const s = it.series || 'Standalone';
    (groups[f] ||= {}); (groups[f][s] ||= []).push(it);
  }

  function renderList(activeId) {
    listEl.innerHTML = '';
    for (const fandom of Object.keys(groups).sort()) {
      const wrap = document.createElement('div'); wrap.className='list-group';
      const h3 = document.createElement('h3'); h3.textContent = fandom; wrap.appendChild(h3);
      const seriesMap = groups[fandom];
      for (const ser of Object.keys(seriesMap).sort()) {
        if (ser !== 'Standalone') { const h4 = document.createElement('div'); h4.textContent = '• ' + ser; h4.style.opacity='0.85'; wrap.appendChild(h4); }
        const items = seriesMap[ser].slice().sort((a,b)=>a.chapter.localeCompare(b.chapter, undefined, {numeric:true}));
        for (const it of items) {
          const a = document.createElement('a'); a.href = '#/read/' + it.id; a.className = 'list-item' + (it.id===activeId?' active':'');
          a.textContent = it.title; wrap.appendChild(a);
        }
      }
      listEl.appendChild(wrap);
    }
  }

  async function loadById(id) {
    const idx = Math.max(0, data.findIndex(x=>x.id===id));
    const item = data[idx] || data[0];
    renderList(item.id);
    const prev = data[Math.max(0, idx-1)] || item;
    const next = data[Math.min(data.length-1, idx+1)] || item;
    const url = buildURL(item.path);
    viewer.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:10px;">
      <a class="btn" href="#/read/${prev.id}">← Previous chapter</a>
      <a class="btn" href="#/read/${next.id}">Next chapter →</a>
    </div><p>Loading…</p>`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
      const html = await res.text();
      viewer.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:10px;">
        <a class="btn" href="#/read/${prev.id}">← Previous chapter</a>
        <a class="btn" href="#/read/${next.id}">Next chapter →</a>
      </div><h2 class="chapter-title">${item.title}</h2>` + html;
    } catch (e) {
      viewer.innerHTML = `<p>Could not load this chapter.</p><code>${item.path}</code><pre>${String(e)}</pre>`;
    }
  }

  function route() {
    const m = location.hash.match(/^#\/read\/(.+)$/);
    if (m) loadById(m[1]); else { renderList(); viewer.innerHTML = '<p>Seleziona un capitolo dalla lista.</p>'; }
  }

  window.addEventListener('hashchange', route);
  route();
})();
