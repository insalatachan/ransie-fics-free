// ===== THEME =====
const htmlEl = document.documentElement;
const THEME_KEY = 'ff_theme';
function setTheme(t){ htmlEl.setAttribute('data-theme', t); localStorage.setItem(THEME_KEY, t); }
function toggleTheme(){ setTheme(htmlEl.getAttribute('data-theme')==='dark'?'light':'dark'); }
const savedTheme = localStorage.getItem(THEME_KEY); setTheme(savedTheme || 'dark');

// ===== ADS ADAPTER =====
// INSERT REAL AD SDK HERE WHEN READY
// For now this simulates watching an ad (6 seconds)
const UNLOCK_TTL_MS = 24*60*60*1000;
const RewardedAdsAdapter = {
  load: async () => { await new Promise(r=>setTimeout(r,200)); return true; },
  show: async () => {
    if(!confirm('Demo ad: press OK to simulate 6 seconds')) throw new Error('cancel');
    await new Promise(r=>setTimeout(r,6000));
    return true;
  }
};

// ===== STORAGE =====
const k = id => `ff_unlock_${id}`;
const getState = id => {
  try {
    return JSON.parse(localStorage.getItem(k(id))||'null') || {
      unlocked:false, progress:0, required:0, expiresAt:0
    };
  } catch {
    return {unlocked:false, progress:0, required:0, expiresAt:0};
  }
};
const setState = (id, st) => localStorage.setItem(k(id), JSON.stringify(st));
const expired = ts => !ts || Date.now()>ts;

// ===== ELEMENTS =====
const sidebarEl = document.getElementById('sidebar');
const drawerEl = document.getElementById('drawer');
const drawerContent = document.getElementById('drawer-content');
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('theme-toggle-desktop').addEventListener('click', toggleTheme);

// ✅ Drawer behavior updated
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
const lockerEl = document.getElementById('locker');

const adsNeededEl = document.getElementById('ads-needed');
const adsBarEl = document.getElementById('ads-bar');
const adsStatusEl = document.getElementById('ads-status');
const watchBtn = document.getElementById('watch-ad');
const fallbackBtn = document.getElementById('fallback');

const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
document.getElementById('year').textContent = new Date().getFullYear();

// ===== DATA =====
const DATA = window.FF_DATA || [];
let current = { story: null, index: -1 };

// ===== CHAPTER CACHE =====
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
const setCached = (ch,html)=>{
  try { localStorage.setItem(ck(ch), JSON.stringify({html,ts:Date.now()})); } catch {}
};

async function loadChapterContent(ch){
  if(ch.content) return ch.content;
  const cached = getCached(ch);
  if(cached) return cached;
  if(ch.contentUrl){
    const res = await fetch(ch.contentUrl, { cache: 'no-store' });
    if(!res.ok) throw new Error('Cannot load chapter');
    const html = await res.text();
    setCached(ch, html);
    return html;
  }
  return '';
}

// ===== SIDEBAR =====
function makeSidebar(container){
  container.innerHTML = '';
  DATA.forEach(group=>{
    const box = document.createElement('div');
    box.className = 'fandom';
    box.setAttribute('aria-expanded','false');

    const btn = document.createElement('button');
    btn.textContent = group.fandom;
    btn.addEventListener('click', ()=>{
      const now = box.getAttribute('aria-expanded')==='true'?'false':'true';
      box.setAttribute('aria-expanded', now);
    });

    const list = document.createElement('div');
    list.className = 'stories';

    (group.stories||[]).forEach(st=>{
      const a = document.createElement('a');
      a.href='#'; a.className='story'; a.textContent = st.title;
      a.addEventListener('click', e=>{
        e.preventDefault();
        openStory(st,0);
        if(drawerEl.getAttribute('aria-hidden')==='false'){
          drawerEl.setAttribute('aria-hidden','true');
          document.body.classList.remove('no-scroll');
        }
      });
      list.appendChild(a);
    });

    box.appendChild(btn);
    box.appendChild(list);
    container.appendChild(box);
  });
}
makeSidebar(sidebarEl);
makeSidebar(drawerContent);

// ===== READER =====
function percent(p,r){
  const v = r ? Math.min(100, Math.round((p/r)*100)) : 0;
  return isNaN(v) ? 0 : v;
}

function openStory(story, chapterIndex){
  current.story = story;
  current.index = chapterIndex;
  renderChapter();
}

async function renderChapter(){
  if(!current.story){
    titleEl.textContent='Select a story';
    metaEl.textContent='—';
    bodyEl.innerHTML='';
    lockerEl.hidden=true;
    prevBtn.disabled=true;
    nextBtn.disabled=true;
    return;
  }

  const ch = current.story.chapters[current.index];
  titleEl.textContent = ch.title;
  metaEl.textContent = `${current.story.title} • ~${ch.minutes} min`;

  prevBtn.disabled = current.index<=0;
  nextBtn.disabled = current.index>=current.story.chapters.length-1;

  const st = getState(ch.id);
  const unlocked = ch.requiredAds===0 || (st.unlocked && !expired(st.expiresAt));

  if(unlocked){
    lockerEl.hidden = true;
    bodyEl.hidden = false;
    bodyEl.innerHTML = await loadChapterContent(ch);
  } else {
    bodyEl.hidden = true;
    bodyEl.innerHTML = '';
    lockerEl.hidden = false;
    updateLocker(ch.requiredAds, st.progress||0);
    await RewardedAdsAdapter.load();
  }
}

function updateLocker(req, prog){
  adsNeededEl.textContent = Math.max(0, req - prog);
  const p = percent(prog, req);
  adsBarEl.style.width = p+'%';
  adsStatusEl.textContent = p+'% completed';
}

function advanceProgress(){
  const ch = current.story.chapters[current.index];
  const st = getState(ch.id);
  const req = ch.requiredAds;
  const prog = (st.progress||0)+1;
  const done = prog>=req;
  setState(ch.id, {
    unlocked: done,
    progress: Math.min(prog,req),
    required: req,
    expiresAt: done ? Date.now()+UNLOCK_TTL_MS : 0
  });
  updateLocker(req, Math.min(prog, req));
  if(done) renderChapter();
}

watchBtn.addEventListener('click', async ()=>{
  if(!current.story) return;
  try {
    watchBtn.disabled = true;
    await RewardedAdsAdapter.show();
    advanceProgress();
  } catch {
    alert('Ad was not completed.');
  } finally {
    watchBtn.disabled = false;
  }
});

fallbackBtn.addEventListener('click', ()=>{
  if(confirm('Use fallback only if ads do not load. Continue?')) advanceProgress();
});

prevBtn.addEventListener('click', ()=>{
  if(current.index>0){
    current.index--;
    renderChapter();
    window.scrollTo({top:0,behavior:'smooth'});
  }
});
nextBtn.addEventListener('click', ()=>{
  if(current.index<current.story.chapters.length-1){
    current.index++;
    renderChapter();
    window.scrollTo({top:0,behavior:'smooth'});
  }
});

// default: open first story if available
if (DATA[0]?.stories[0]) openStory(DATA[0].stories[0], 0);