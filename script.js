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

// Drawer mobile con blocco scroll
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
const DATA = window.FF_DATA || [];
let current = { story: null, index: -1 };

// ===== CHAPTER LOADER (with cache) =====
const CH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ck = ch => `ff_chapter_${ch.id}`;
const getCached = ch => {
  try { const raw = localStorage.getItem(ck(ch)); if(!raw) return null;
    const {html,ts} = JSON.parse(raw); if(!ts || Date.now()-ts>CH_CACHE_TTL_MS) return null; return html;
  } catch { return null; }
};
const setCached = (ch,html)=>{ try { localStorage.setItem(ck(ch), JSON.stringify({html,ts:Date.now()})); } catch {} };

async function loadChapterContent(ch){
  if(ch.content) return ch.content;
  const cached = getCached(ch); if(cached) return cached;
  if(ch.contentUrl){
    const res = await fetch(ch.contentUrl, { cache: 'no-store' });
    if(!res.ok) throw new Error('Cannot load chapter');
    const html = await res.text(); setCached(ch, html); return html;
  }
  return '';
}

// ===== SIDEBAR WITH EXPANDABLE CHAPTERS =====
function makeSidebar(container){
  container.innerHTML = '';

  DATA.forEach(group=>{
    // FANDOM
    const fanBox = document.createElement('div');
    fanBox.className = 'fandom';
    fanBox.setAttribute('aria-expanded','false');

    const fanBtn = document.createElement('button');
    fanBtn.textContent = group.fandom;
    fanBtn.addEventListener('click', ()=>{
      const now = fanBox.getAttribute('aria-expanded')==='true' ? 'false' : 'true';
      fanBox.setAttribute('aria-expanded', now);
    });

    const storiesWrap = document.createElement('div');
    storiesWrap.className = 'stories';

    // STORIES
    (group.stories || []).forEach(st=>{
      const storyBox = document.createElement('div');
      storyBox.className = 'storybox';
      storyBox.setAttribute('aria-expanded','false');

      const storyBtn = document.createElement('button');
      storyBtn.className = 'story-btn';
      storyBtn.textContent = st.title;
      storyBtn.addEventListener('click', ()=>{
        const now = storyBox.getAttribute('aria-expanded')==='true' ? 'false' : 'true';
        storyBox.setAttribute('aria-expanded', now);
      });

      // CHAPTERS
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

// ===== READER =====
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
    prevBtn.disabled=true; nextBtn.disabled=true; 
    return;
  }

  const ch = current.story.chapters[current.index];
  titleEl.textContent = ch.title;
  metaEl.textContent = `${current.story.title} • ~${ch.minutes} min`;

  prevBtn.disabled = current.index<=0;
  nextBtn.disabled = current.index>=current.story.chapters.length-1;

  bodyEl.hidden = false;
  bodyEl.innerHTML = await loadChapterContent(ch);

  // Evidenzia capitolo attivo in sidebar e drawer
  highlightActiveChapter(sidebarEl, current.story, current.index);
  highlightActiveChapter(drawerContent, current.story, current.index);
}

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

// Default: open first story if available
if (DATA[0]?.stories[0]) openStory(DATA[0].stories[0], 0);
