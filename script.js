(function () {
  const app = document.getElementById('app');
  const listEl = document.getElementById('list');
  const viewer = document.getElementById('viewer');

  const data = Array.isArray(window.FF_DATA) ? window.FF_DATA : [];
  if (!data.length) {
    viewer.textContent = 'Nessun capitolo trovato. Controlla data.js.';
    return;
  }

  // Group by fandom > series
  const groups = {};
  for (const item of data) {
    const fan = item.fandom || 'Misc';
    const ser = item.series || 'Standalone';
    groups[fan] = groups[fan] || {};
    groups[fan][ser] = groups[fan][ser] || [];
    groups[fan][ser].push(item);
  }

  function renderList(activeId) {
    listEl.innerHTML = '';
    for (const fandom of Object.keys(groups).sort()) {
      const fanWrap = document.createElement('div');
      fanWrap.className = 'list-group';
      const h3 = document.createElement('h3');
      h3.textContent = fandom;
      fanWrap.appendChild(h3);

      const seriesMap = groups[fandom];
      for (const series of Object.keys(seriesMap).sort()) {
        if (series !== 'Standalone') {
          const h4 = document.createElement('div');
          h4.style.margin = '6px 0 4px'; h4.style.opacity = '0.9'; h4.textContent = '• ' + series;
          fanWrap.appendChild(h4);
        }
        const items = seriesMap[series].slice().sort((a, b) => a.chapter.localeCompare(b.chapter, undefined, {numeric:true}));
        for (const it of items) {
          const a = document.createElement('a');
          a.href = '#/read/' + it.id;
          a.className = 'list-item' + (it.id === activeId ? ' active' : '');
          a.textContent = it.title;
          fanWrap.appendChild(a);
        }
      }
      listEl.appendChild(fanWrap);
    }
  }

  async function loadChapterById(id) {
    const item = data.find(x => x.id === id) || data[0];
    if (!item) return;
    renderList(item.id);
    viewer.innerHTML = '<p>Loading…</p>';
    try {
      const res = await fetch(item.path, {cache: 'no-store'});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      viewer.innerHTML = '<h2 class="chapter-title">' + item.title + '</h2>' + html;
    } catch (e) {
      viewer.innerHTML = '<p>Errore nel caricamento del capitolo: ' + (e.message || e) + '</p>';
    }
  }

  function route() {
    const m = location.hash.match(/^#\/read\/(.+)$/);
    if (m) {
      loadChapterById(m[1]);
    } else {
      renderList();
      viewer.innerHTML = '<p>Seleziona un capitolo dalla lista.</p>';
    }
  }

  window.addEventListener('hashchange', route);
  renderList();
  route();
})();
