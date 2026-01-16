export function html() {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Bkmarks</title>
      <link rel="stylesheet" href="/static/app.css">
    </head>
    <body>
      <div id="app">
        <header class="topbar">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true"></span>
            <div class="brand-text">
              <div class="brand-title">Bkmarks</div>
              <div class="brand-subtitle">管理与导航</div>
            </div>
          </div>
          <div class="search-wrap">
            <input id="search" class="search" placeholder="搜索书签">
          </div>
          <div id="user" class="user"></div>
        </header>
        <main class="shell">
          <aside class="sidebar">
            <div class="section-title">标签</div>
            <div id="tags" class="tags"></div>
          </aside>
          <section class="content">
            <div id="content" class="content-body">
              <div id="register" class="panel hidden">
                <h2>注册</h2>
                <input id="ru" placeholder="用户名">
                <input id="rp" type="password" placeholder="密码">
                <button id="registerBtn">注册</button>
              </div>
              <div id="login" class="panel hidden">
                <h2>登录</h2>
                <input id="u" placeholder="用户名">
                <input id="p" type="password" placeholder="密码">
                <button id="loginBtn">登录</button>
              </div>
              <div id="list" class="grid"></div>
            </div>
          </section>
        </main>
      </div>
      <script src="/static/app.js"></script>
    </body>
  </html>`
}

export function css() {
  return `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@500;600;700&display=swap');
:root{
  --bg:#f4f6fb;
  --bg-accent:#eef2f8;
  --surface:#ffffff;
  --surface-2:rgba(255,255,255,0.85);
  --text:#111827;
  --muted:#5b6472;
  --primary:#2563eb;
  --primary-strong:#1d4ed8;
  --accent:#f97316;
  --border:rgba(15,23,42,0.08);
  --shadow:0 18px 40px rgba(15,23,42,0.12);
  --shadow-soft:0 10px 30px rgba(15,23,42,0.08);
  --shadow-card:0 16px 40px rgba(12,20,33,0.08);
  --radius:18px;
}
*{box-sizing:border-box}
body{
  margin:0;
  background:
    radial-gradient(900px 500px at 15% -10%,#ffffff 0%,var(--bg) 60%),
    radial-gradient(700px 400px at 85% 0%,rgba(59,130,246,0.12) 0%,transparent 60%),
    linear-gradient(180deg,#ffffff 0%,var(--bg-accent) 100%);
  color:var(--text);
  font-family:"Noto Sans JP","SF Pro Text","SF Pro Display","Helvetica Neue",Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
}
#app{min-height:100vh}
header.topbar{
  position:sticky;
  top:12px;
  z-index:10;
  display:flex;
  align-items:center;
  gap:16px;
  margin:16px 24px 0;
  padding:14px 20px;
  background:var(--surface-2);
  border:1px solid var(--border);
  border-radius:999px;
  backdrop-filter:blur(16px);
  box-shadow:var(--shadow-soft);
}
.brand{
  display:flex;
  align-items:center;
  gap:12px;
  min-width:200px;
}
.brand-mark{
  width:36px;
  height:36px;
  border-radius:12px;
  background:linear-gradient(145deg,#ffffff,#dfe7f6);
  border:1px solid rgba(15,23,42,0.08);
  box-shadow:0 10px 20px rgba(15,23,42,0.12);
}
.brand-title{
  font-family:"Noto Serif JP","Times New Roman",serif;
  font-weight:600;
  font-size:16px;
  letter-spacing:-0.01em;
}
.brand-subtitle{font-size:12px;color:var(--muted)}
.search-wrap{flex:1;display:flex;justify-content:center}
.search{
  width:min(520px,100%);
  padding:10px 16px;
  border:1px solid rgba(148,163,184,0.35);
  border-radius:999px;
  background:rgba(255,255,255,0.92);
  font-size:14px;
  transition:border-color 180ms ease,box-shadow 180ms ease;
}
.search:focus{outline:none;border-color:rgba(10,132,255,0.65);box-shadow:0 0 0 4px rgba(10,132,255,0.12)}
.user{
  min-width:120px;
  text-align:right;
  color:var(--muted);
  font-size:13px;
  position:relative;
}
.user-trigger{
  border:1px solid rgba(148,163,184,0.25);
  background:rgba(255,255,255,0.9);
  color:var(--text);
  padding:8px 12px;
  border-radius:999px;
  font-size:13px;
  font-weight:600;
  cursor:pointer;
  transition:border-color 180ms ease,box-shadow 180ms ease,background 180ms ease;
}
.user-trigger:hover{border-color:rgba(37,99,235,0.35)}
.user-trigger:focus-visible{outline:2px solid rgba(37,99,235,0.35);outline-offset:2px}
.user-menu{
  position:absolute;
  right:0;
  top:44px;
  min-width:200px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:14px;
  box-shadow:var(--shadow-soft);
  padding:8px;
  display:none;
}
.user-menu.open{display:block}
.menu-item{
  width:100%;
  text-align:left;
  background:transparent;
  border:none;
  padding:8px 10px;
  border-radius:10px;
  font-size:13px;
  color:var(--text);
  cursor:pointer;
  transition:background 180ms ease;
}
.menu-item:hover{background:rgba(15,23,42,0.06)}
.menu-divider{height:1px;background:rgba(15,23,42,0.06);margin:6px 0}
.menu-panel{
  margin-top:6px;
  padding:10px;
  border-radius:12px;
  background:rgba(15,23,42,0.04);
  font-size:12px;
  color:var(--muted);
  line-height:1.5;
}
.menu-panel strong{color:var(--text);font-weight:600}
.shell{
  display:grid;
  grid-template-columns:240px 1fr;
  gap:20px;
  padding:20px 24px 32px;
  max-width:1280px;
  margin:0 auto;
}
.sidebar{
  background:var(--surface-2);
  border:1px solid var(--border);
  border-radius:calc(var(--radius) + 2px);
  padding:18px;
  box-shadow:var(--shadow-soft);
  backdrop-filter:blur(16px);
  height:fit-content;
}
.section-title{
  font-size:12px;
  font-weight:600;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:var(--muted);
  margin-bottom:14px;
}
.tags{display:flex;flex-direction:column;gap:8px}
.pill{
  text-align:left;
  padding:10px 14px;
  border:1px solid rgba(148,163,184,0.22);
  border-radius:12px;
  background:rgba(255,255,255,0.92);
  color:var(--text);
  cursor:pointer;
  font-weight:500;
  transition:background 180ms ease,border-color 180ms ease,box-shadow 180ms ease;
}
.pill:hover{
  border-color:rgba(37,99,235,0.35);
  box-shadow:0 8px 16px rgba(15,23,42,0.08);
}
.pill.active{
  background:linear-gradient(135deg,var(--primary),var(--primary-strong));
  border-color:var(--primary);
  color:#fff;
  box-shadow:0 12px 24px rgba(10,132,255,0.2);
}
.content-body{min-height:60vh}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{
  position:relative;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  padding:18px;
  display:flex;
  flex-direction:column;
  gap:8px;
  box-shadow:var(--shadow-card);
  cursor:pointer;
  transition:box-shadow 180ms ease,transform 180ms ease,border-color 180ms ease;
}
.card::before{
  content:"";
  position:absolute;
  inset:0 0 auto 0;
  height:3px;
  border-radius:16px 16px 0 0;
  background:linear-gradient(90deg,rgba(37,99,235,0.6),rgba(249,115,22,0.6));
  opacity:0;
  transition:opacity 180ms ease;
}
.card:hover{
  border-color:rgba(37,99,235,0.28);
  box-shadow:0 20px 40px rgba(12,20,33,0.14);
  transform:translateY(-2px);
}
.card:focus-visible{
  outline:2px solid rgba(37,99,235,0.4);
  outline-offset:2px;
}
.card:hover::before{opacity:1}
.status-dot{position:absolute;right:14px;top:14px;width:9px;height:9px;border-radius:50%}
.status-ok{background:#34c759;box-shadow:0 0 0 4px rgba(52,199,89,0.18)}
.status-bad{background:#ff3b30;box-shadow:0 0 0 4px rgba(255,59,48,0.18)}
.status-label{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:11px;
  font-weight:600;
  color:var(--muted);
  background:rgba(15,23,42,0.04);
  border:1px solid rgba(15,23,42,0.08);
  border-radius:999px;
  padding:4px 10px;
}
.card-head{
  display:flex;
  align-items:center;
  gap:10px;
}
.favicon{
  width:28px;
  height:28px;
  border-radius:8px;
  background:linear-gradient(145deg,#ffffff,#e8edf6);
  border:1px solid rgba(15,23,42,0.08);
  display:grid;
  place-items:center;
  overflow:hidden;
}
.favicon img{
  width:16px;
  height:16px;
}
.title{
  font-weight:600;
  font-size:15px;
  line-height:1.4;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.meta{
  display:flex;
  align-items:center;
  gap:8px;
}
.url{
  font-size:12px;
  color:var(--muted);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  flex:1;
  min-width:0;
}
.ai-btn{
  border:1px solid rgba(37,99,235,0.25);
  background:rgba(37,99,235,0.08);
  color:#1d4ed8;
  border-radius:999px;
  padding:4px 10px;
  font-size:11px;
  font-weight:600;
  cursor:pointer;
  transition:background 180ms ease,border-color 180ms ease,filter 180ms ease;
}
.ai-btn:hover{border-color:rgba(37,99,235,0.4);filter:brightness(1.02)}
.ai-btn:disabled{cursor:default;opacity:0.6}
.ai-btn.loading{opacity:0.7}
.tags-row{
  font-size:12px;
  color:var(--muted);
  display:flex;
  gap:6px;
  flex-wrap:wrap;
}
.tag{
  padding:3px 8px;
  border-radius:999px;
  border:1px solid rgba(37,99,235,0.2);
  background:rgba(37,99,235,0.08);
  color:#1d4ed8;
  font-weight:500;
}
.panel{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:18px;
  padding:22px;
  max-width:380px;
  box-shadow:var(--shadow-soft);
}
.panel h2{margin:0 0 12px 0;font-size:20px;font-weight:700}
.panel input{
  width:100%;
  margin:8px 0;
  padding:12px;
  border:1px solid rgba(148,163,184,0.35);
  border-radius:12px;
  background:#f8fafc;
}
.panel input:focus{outline:none;border-color:rgba(10,132,255,0.65);box-shadow:0 0 0 4px rgba(10,132,255,0.12)}
.panel button{
  width:100%;
  margin-top:12px;
  padding:12px 16px;
  border:none;
  border-radius:12px;
  background:linear-gradient(135deg,var(--primary),var(--primary-strong));
  color:#fff;
  font-weight:600;
  box-shadow:0 12px 24px rgba(10,132,255,0.25);
}
.panel button:hover{filter:brightness(1.03)}
.hidden{display:none}
body.login main.shell{
  grid-template-columns:1fr;
  justify-items:center;
}
body.login .sidebar,
body.login #list{display:none}
@media (prefers-reduced-motion: reduce){
  *{transition:none!important}
}
@media (max-width:960px){
  header.topbar{flex-wrap:wrap;border-radius:24px}
  .brand{min-width:auto}
  .shell{grid-template-columns:1fr}
  .sidebar{order:2}
}
@media (max-width:600px){
  header.topbar{padding:12px 14px;margin:12px 14px 0}
  .shell{padding:14px}
  .search-wrap{width:100%}
}`
}

export function js() {
  return `(function(){const qs=(s)=>document.querySelector(s);const elTags=qs('#tags');const elList=qs('#list');const elSearch=qs('#search');const elUser=qs('#user');const elRegister=qs('#register');const elLogin=qs('#login');const elRU=qs('#ru');const elRP=qs('#rp');const elRegisterBtn=qs('#registerBtn');const elU=qs('#u');const elP=qs('#p');const elLoginBtn=qs('#loginBtn');let items=[];let activeTag='全部';let menuOpen=false;let panelMode='';function hostFrom(url){try{return new URL(url).hostname}catch{return''}}function originFrom(url){try{return new URL(url).origin}catch{return''}}function formatTime(ts){if(!ts)return'-';try{return new Date(ts).toLocaleString()}catch{return'-'}}function closeMenu(){const menu=elUser.querySelector('.user-menu');const trigger=elUser.querySelector('.user-trigger');if(menu)menu.classList.remove('open');if(trigger)trigger.setAttribute('aria-expanded','false');menuOpen=false}function openMenu(){const menu=elUser.querySelector('.user-menu');const trigger=elUser.querySelector('.user-trigger');if(menu)menu.classList.add('open');if(trigger)trigger.setAttribute('aria-expanded','true');menuOpen=true}function toggleMenu(){menuOpen?closeMenu():openMenu()}async function loadSettings(panel){try{const r=await fetch('/api/config');if(!r.ok)throw new Error('bad');const j=await r.json();const ai=j.ai_enabled?'开启':'关闭';const g=j.limits?.global??'-';const u=j.limits?.user??'-';panel.innerHTML='<div><strong>系统设置</strong></div><div>AI：'+ai+'</div><div>全局限额：'+g+'</div><div>用户限额：'+u+'</div>'}catch{panel.textContent='无法获取配置'}}async function loadStatus(panel){try{const r=await fetch('/api/system/status');if(!r.ok)throw new Error('bad');const j=await r.json();const b=j.bookmarks||{};const ai=j.ai||{};const usage=ai.usage||{};const aiEnabled=ai.enabled?'开启':'关闭';panel.innerHTML='<div><strong>系统状态</strong></div><div>书签总数：'+(b.total??0)+'</div><div>已 AI 识别：'+(b.aiTagged??0)+'</div><div>最近同步：'+formatTime(b.updatedAt)+'</div><div>最近 AI 识别：'+formatTime(b.lastAiAt)+'</div><div>AI：'+aiEnabled+'</div><div>今日用量：'+(usage.userUsed??0)+' / '+(ai.limits?.user??'-')+'</div>'}catch{panel.textContent='无法获取状态'}}function setUserMenu(username){elUser.innerHTML='<button class=\"user-trigger\" type=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">'+username+'</button><div class=\"user-menu\" role=\"menu\"><button class=\"menu-item\" type=\"button\" data-action=\"settings\">系统设置</button><button class=\"menu-item\" type=\"button\" data-action=\"status\">状态</button><div class=\"menu-panel\" aria-live=\"polite\"></div></div>';const trigger=elUser.querySelector('.user-trigger');const menu=elUser.querySelector('.user-menu');const panel=elUser.querySelector('.menu-panel');trigger.addEventListener('click',(e)=>{e.stopPropagation();toggleMenu()});menu.addEventListener('click',(e)=>{const btn=e.target.closest('.menu-item');if(!btn)return;panelMode=btn.dataset.action||'';panel.textContent='加载中...';if(panelMode==='settings')loadSettings(panel);if(panelMode==='status')loadStatus(panel)});document.addEventListener('click',(e)=>{if(!elUser.contains(e.target))closeMenu()});panel.textContent='选择菜单查看信息'}async function runAi(it,btn){if(btn.disabled)return;btn.classList.add('loading');btn.textContent='识别中';try{const r=await fetch('/api/ai/classify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:it.url,title:it.title||''})});if(!r.ok)throw new Error('bad');await fetchItems()}catch{btn.textContent='重试';btn.classList.remove('loading')}}function renderTags(){const tags=new Map();tags.set('全部',items.length);for(const it of items){(it.tags||[]).forEach(t=>tags.set(t,(tags.get(t)||0)+1))}const arr=Array.from(tags.entries()).sort((a,b)=>b[1]-a[1]);elTags.innerHTML='';arr.forEach(([t,c])=>{const d=document.createElement('button');d.className='pill'+(t===activeTag?' active':'');d.textContent=t;d.onclick=()=>{activeTag=t;renderList()};elTags.appendChild(d)})}function renderList(){const q=(elSearch.value||'').toLowerCase();const filtered=items.filter(it=>{const inTag=activeTag==='全部'||(it.tags||[]).includes(activeTag);const str=(it.title||'')+' '+(it.url||'');const inSearch=str.toLowerCase().includes(q);return inTag&&inSearch});elList.innerHTML='';filtered.forEach(it=>{const card=document.createElement('div');card.className='card';card.tabIndex=0;card.setAttribute('role','link');card.setAttribute('aria-label',it.title||it.url);card.addEventListener('click',(e)=>{if(e.target.closest('.ai-btn'))return;window.open(it.url,'_blank')});card.addEventListener('keydown',(e)=>{if(e.key==='Enter')window.open(it.url,'_blank')});const dot=document.createElement('div');dot.className='status-dot '+((it.status==='ok')?'status-ok':'status-bad');const head=document.createElement('div');head.className='card-head';const fav=document.createElement('div');fav.className='favicon';const host=hostFrom(it.url);const origin=originFrom(it.url);const img=document.createElement('img');img.alt=host;img.src=origin?(origin+'/favicon.ico'):'';img.onerror=()=>{if(img.dataset.fallback)return;img.dataset.fallback='1';img.src=host?('https://www.google.com/s2/favicons?domain='+host+'&sz=64'):''};fav.appendChild(img);const t=document.createElement('div');t.className='title';t.textContent=it.title||it.url;head.appendChild(fav);head.appendChild(t);const meta=document.createElement('div');meta.className='meta';const u=document.createElement('div');u.className='url';u.textContent=host||it.url;const st=document.createElement('div');st.className='status-label';st.textContent=(it.status==='ok')?'可用':'需检查';const aiBtn=document.createElement('button');aiBtn.type='button';aiBtn.className='ai-btn';if(it.aiCheckedAt){aiBtn.textContent='已识别';aiBtn.disabled=true}else{aiBtn.textContent='AI识别';aiBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();runAi(it,aiBtn)})}meta.appendChild(u);meta.appendChild(st);meta.appendChild(aiBtn);const tg=document.createElement('div');tg.className='tags-row';(it.tags||[]).slice(0,3).forEach(tag=>{const s=document.createElement('span');s.className='tag';s.textContent=tag;tg.appendChild(s)});card.appendChild(dot);card.appendChild(head);card.appendChild(meta);card.appendChild(tg);elList.appendChild(card)})}function showLogin(){elLogin.classList.remove('hidden');elRegister.classList.add('hidden')}function showRegister(){elRegister.classList.remove('hidden');elLogin.classList.add('hidden')}async function fetchRegistration(){const r=await fetch('/api/auth/registration');if(r.status===200){const j=await r.json();if(j.open){showRegister();return true}}showLogin();return false}async function fetchMe(){const r=await fetch('/api/auth/me');if(r.status===200){const j=await r.json();setUserMenu(j.user.username);document.body.classList.remove('login');elLogin.classList.add('hidden');elRegister.classList.add('hidden');return true}else{elUser.textContent='未登录';document.body.classList.add('login');await fetchRegistration();return false}}async function fetchItems(){const r=await fetch('/api/bookmarks/list');if(r.status!==200){items=[];renderTags();renderList();return}const j=await r.json();items=j.items||[];renderTags();renderList()}async function runCheck(){await fetch('/api/links/check?limit=20',{method:'POST'});await fetchItems()}elSearch.addEventListener('input',renderList);elRegisterBtn.addEventListener('click',async()=>{const username=elRU.value.trim();const password=elRP.value;if(!username||!password)return;const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});if(r.status===200){showLogin()}});elLoginBtn.addEventListener('click',async()=>{const username=elU.value.trim();const password=elP.value;if(!username||!password)return;const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});if(r.status===200){elLogin.classList.add('hidden');elRegister.classList.add('hidden');document.body.classList.remove('login');fetchMe().then(()=>{fetchItems();runCheck()})}});fetchMe().then(()=>{fetchItems();runCheck()})})();`
}
