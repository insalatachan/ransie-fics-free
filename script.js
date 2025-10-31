// ===== THEME =====
const htmlEl = document.documentElement;
const THEME_KEY = 'ff_theme';
function setTheme(t){ htmlEl.setAttribute('data-theme', t); localStorage.setItem(THEME_KEY, t); }
function toggleTheme(){ setTheme(htmlEl.getAttribute('data-theme')==='dark'?'light':'dark'); }
setTheme(localStorage.getItem(THEME_KEY) || 'dark');

// ===== ELEMENTS =====
const sidebarEl = document.getElementById('sidebar');
const drawerEl = document.getElementById('drawer');
const drawerContent = document.getElementById('drawer-content');
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('theme-toggle-desktop').addEventListener('click', toggleTheme);

// Drawer mobile
document.getElementById('open-drawer')?.addEventListener('click', ()=>{
  drawerEl.setAttribute('aria-hidden','false');
  document.body.classList.add('no-scroll');
});
document.getElementById('close-drawer')?.addEventListener('click', ()=>{
  drawerEl.setAttribute('aria-hidden','true');
  document.body.classList.remove('no-scroll');
});
drawerEl.addEventListener('click', e=>{
  if(e.target===drawerEl){
    drawerEl.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }
});

const titleEl = document.getElementById('chapter-title');
const metaEl = document.getElementById('chapter-meta');
const bodyEl = document.getElementById('chapter-body');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
document.getElementById('year').textContent = new Date().getFullYear();

// ===== FONT SIZE =====
const sizes = [0.95, 1.0, 1.1, 1.25, 1.4];
let sizeIdx = parseInt(localStorage.getItem('ff_font')||'1',10);
sizeIdx = isNaN(sizeIdx) ? 1 : Math.min(Math.max(sizeIdx,0), sizes.length-1);
function applySize(){ document.documentElement.style.setProperty('--article-size', sizes[sizeIdx]+'rem'); localStorage.setItem('ff_font', String(sizeIdx)); }
applySize();
document.getElementById('font-inc').addEventListener('click', ()=>{ if(sizeIdx<sizes.length-1){ sizeIdx++; applySize(); } });
document.getElementById('font-dec').addEventListener('click', ()=>{ if(sizeIdx>0){ sizeIdx--; applySize(); } });

// ===== DATA =====
const DATA = Array.isArray(window.FF_DATA) ? window.FF_DATA : [];
let current = { story: null, index: -1 };

// ===== CHAPTER CACHE/LOAD =====
const CH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ck = ch => `ff_chapter_${ch.id}`;
const getCached = ch => {
  try {
    const raw = localStorage.getItem(ck(ch));
    if(!raw) return null;
    const {html,ts} = JSON.parse(raw);
    if(!ts || Date.now()-ts>CH_CACHE_TTL_MS) return null;
    return html;
  } catch { return null; }
};
const setCached = (ch,html)=>{ try { localStorage.setItem(ck(ch), JSON.stringify({html,ts:Date.now()})); } catch {} };

async function loadChapterContent(ch){
  if(ch.content) return ch.content;
  const cached = getCached(ch); if(cached) return cached;
  if(ch.contentUrl){
    const res = await fetch(ch.contentUrl, { cache: 'no-store' });
    if(!res.ok) throw new Error(`Fetch failed ${res.status}: ${ch.contentUrl}`);
    const html = await res.text(); setCached(ch, html); return html;
  }
  throw new Error('Missing contentUrl');
}

// ===== SIDEBAR WITH EXPANDABLE CHAPTERS =====
function makeSidebar(container){
  container.innerHTML = '';

  if (!DATA.length) {
    const box = document.createElement('div');
    box.className = 'muted';
    box.style.padding = '12px';
    box.innerHTML = `<p><strong>No stories found.</strong></p>
    <p>Check that <code>data.js</code> loaded correctly and contains <code>window.FF_DATA = [...]</code>.</p>`;
    container.appendChild(box);
    return;
  }

  DATA.forEach((group, gi)=>{
    const fanBox = document.createElement('div');
    fanBox.className = 'fandom';
    fanBox.setAttribute('aria-expanded', gi===0 ? 'true' : 'false');

    const fanBtn = document.createElement('button');
    fanBtn.textContent = group.fandom || 'Fandom';
    fanBtn.addEventListener('click', ()=>{
      const now = fanBox.getAttribute('aria-expanded')==='true' ? 'false' : 'true';
      fanBox.setAttribute('aria-expanded', now);
    });

    const storiesWrap = document.createElement('div');
    storiesWrap.className = 'stories';

    (group.stories || []).forEach((st)=>{
      const storyBox = document.createElement('div');
      storyBox.className = 'storybox';
      storyBox.setAttribute('aria-expanded', 'false');

      const storyBtn = document.createElement('button');
      storyBtn.className = 'story-btn';
      storyBtn.textContent = st.title || 'Story';
      storyBtn.addEventListener('click', ()=>{
        const now = storyBox.getAttribute('aria-expanded')==='true' ? 'false' : 'true';
        storyBox.setAttribute('aria-expanded', now);
      });

      const chList = document.createElement('div');
      chList.className = 'chapters';

      (st.chapters || []).forEach((ch, idx)=>{
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'chapter-link';
        a.textContent = ch.title || `Chapter ${idx+1}`;
        a.addEventListener('click', e=>{
          e.preventDefault();
          openStory(st, idx);
          if(drawerEl.getAttribute('aria-hidden')==='false'){
            drawerEl.setAttribute('aria-hidden','true');
            document.body.classList.remove('no-scroll');
          }
          highlightActiveChapter(container, st, idx);
        });
        chList.appendChild(a);
      });

      storyBox.appendChild(storyBtn);
      storyBox.appendChild(chList);
      storiesWrap.appendChild(storyBox);
    });

    fanBox.appendChild(fanBtn);
    fanBox.appendChild(storiesWrap);
    container.appendChild(fanBox);
  });
}

function highlightActiveChapter(root, story, idx){
  root.querySelectorAll('.chapter-link.active').forEach(el=>el.classList.remove('active'));
  const boxes = Array.from(root.querySelectorAll('.storybox'));
  boxes.forEach(box=>{
    const title = box.querySelector('.story-btn')?.textContent?.trim();
    if(title === (story?.title||'')){
      box.setAttribute('aria-expanded','true');
      const links = box.querySelectorAll('.chapter-link');
      if(links[idx]) links[idx].classList.add('active');
    }
  });
}

makeSidebar(sidebarEl);
makeSidebar(drawerContent);

// ===== READER & NAVIGATION =====
function openStory(story, chapterIndex){
  current.story = story;
  setIndex(chapterIndex);
}

function setIndex(newIdx){
  if(!current.story) return;
  const max = current.story.chapters.length - 1;
  const clamped = Math.max(0, Math.min(newIdx, max));
  current.index = clamped;
  // update buttons state here to avoid stale UI
  prevBtn.disabled = current.index<=0;
  nextBtn.disabled = current.index>=max;
  renderChapter();
}

function goPrev(){
  if(!current.story) return;
  if(current.index>0) setIndex(current.index - 1);
}
function goNext(){
  if(!current.story) return;
  const max = current.story.chapters.length - 1;
  if(current.index<max) setIndex(current.index + 1);
}

prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); goPrev(); window.scrollTo({top:0,behavior:'smooth'}); });
nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); goNext(); window.scrollTo({top:0,behavior:'smooth'}); });

async function renderChapter(){
  if(!current.story){
    titleEl.textContent='Welcome';
    metaEl.textContent='—';
    bodyEl.innerHTML = `
      <div style="max-width:640px;line-height:1.7;font-size:1.05rem">
        <h2 style="margin:0 0 .5rem 0">Welcome to my Fanfiction Library</h2>
        <p>Thank you for visiting and reading my stories. Your support helps me keep writing and releasing new chapters.</p>
        <p>If you enjoy the content and want to support my work, consider joining me on Patreon for early access and exclusive extras.</p>
        <p style="margin-top:14px">
          <a href="https://www.patreon.com/" target="_blank"
             style="padding:10px 16px;background:#e85b46;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">
            Support me on Patreon ❤️
          </a>
        </p>
      </div>
    `;
    return;
  }

  const ch = current.story.chapters[current.index];
  titleEl.textContent = ch.title;
  metaEl.textContent = `${current.story.title} • ~${ch.minutes} min`;

  bodyEl.hidden = false;
  bodyEl.innerHTML = '<p class="muted">Loading…</p>';

  try {
    const html = await loadChapterContent(ch);
    bodyEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    bodyEl.innerHTML = `
      <div class="muted">
        <p>Could not load this chapter.</p>
        <p style="font-size:.95rem"><code>${ch.contentUrl}</code></p>
      </div>`;
  }

  // keep UI in sync
  const max = current.story.chapters.length - 1;
  prevBtn.disabled = current.index<=0;
  nextBtn.disabled = current.index>=max;

  highlightActiveChapter(sidebarEl, current.story, current.index);
  highlightActiveChapter(drawerContent, current.story, current.index);
}

// No auto-open, homepage shows welcome
