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
}
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
  padding:16px 16px 18px;
  display:flex;
  flex-direction:column;
  gap:8px;
  box-shadow:0 10px 26px rgba(15,23,42,0.08);
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
  box-shadow:0 18px 32px rgba(15,23,42,0.14);
  transform:translateY(-2px);
}
.card:hover::before{opacity:1}
.status-dot{position:absolute;right:12px;top:12px;width:8px;height:8px;border-radius:50%}
.status-ok{background:#34c759}
.status-bad{background:#ff3b30}
.title{
  font-weight:600;
  font-size:15px;
  line-height:1.4;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.url{
  font-size:12px;
  color:var(--muted);
  overflow:hidden;
  text-overflow:ellipsis;
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
  return `(function(){const qs=(s)=>document.querySelector(s);const elTags=qs('#tags');const elList=qs('#list');const elSearch=qs('#search');const elUser=qs('#user');const elRegister=qs('#register');const elLogin=qs('#login');const elRU=qs('#ru');const elRP=qs('#rp');const elRegisterBtn=qs('#registerBtn');const elU=qs('#u');const elP=qs('#p');const elLoginBtn=qs('#loginBtn');let items=[];let activeTag='全部';function renderTags(){const tags=new Map();tags.set('全部',items.length);for(const it of items){(it.tags||[]).forEach(t=>tags.set(t,(tags.get(t)||0)+1))}const arr=Array.from(tags.entries()).sort((a,b)=>b[1]-a[1]);elTags.innerHTML='';arr.forEach(([t,c])=>{const d=document.createElement('button');d.className='pill'+(t===activeTag?' active':'');d.textContent=t;d.onclick=()=>{activeTag=t;renderList()};elTags.appendChild(d)})}function renderList(){const q=(elSearch.value||'').toLowerCase();const filtered=items.filter(it=>{const inTag=activeTag==='全部'||(it.tags||[]).includes(activeTag);const str=(it.title||'')+' '+(it.url||'');const inSearch=str.toLowerCase().includes(q);return inTag&&inSearch});elList.innerHTML='';filtered.forEach(it=>{const a=document.createElement('a');a.className='card';a.href=it.url;a.target='_blank';const dot=document.createElement('div');dot.className='status-dot '+((it.status==='ok')?'status-ok':'status-bad');const t=document.createElement('div');t.className='title';t.textContent=it.title||it.url;const u=document.createElement('div');u.className='url';u.textContent=it.url;const tg=document.createElement('div');tg.className='url';tg.textContent=(it.tags||[]).slice(0,3).join(' · ');a.appendChild(dot);a.appendChild(t);a.appendChild(u);a.appendChild(tg);elList.appendChild(a)})}function showLogin(){elLogin.classList.remove('hidden');elRegister.classList.add('hidden')}function showRegister(){elRegister.classList.remove('hidden');elLogin.classList.add('hidden')}async function fetchRegistration(){const r=await fetch('/api/auth/registration');if(r.status===200){const j=await r.json();if(j.open){showRegister();return true}}showLogin();return false}async function fetchMe(){const r=await fetch('/api/auth/me');if(r.status===200){const j=await r.json();elUser.textContent=j.user.username;document.body.classList.remove('login');elLogin.classList.add('hidden');elRegister.classList.add('hidden');return true}else{elUser.textContent='未登录';document.body.classList.add('login');await fetchRegistration();return false}}async function fetchItems(){const r=await fetch('/api/bookmarks/list');if(r.status!==200){items=[];renderTags();renderList();return}const j=await r.json();items=j.items||[];renderTags();renderList()}async function runCheck(){await fetch('/api/links/check?limit=20',{method:'POST'});await fetchItems()}elSearch.addEventListener('input',renderList);elRegisterBtn.addEventListener('click',async()=>{const username=elRU.value.trim();const password=elRP.value;if(!username||!password)return;const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});if(r.status===200){showLogin()}});elLoginBtn.addEventListener('click',async()=>{const username=elU.value.trim();const password=elP.value;if(!username||!password)return;const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});if(r.status===200){elLogin.classList.add('hidden');elRegister.classList.add('hidden');document.body.classList.remove('login');fetchMe().then(()=>{fetchItems();runCheck()})}});fetchMe().then(()=>{fetchItems();runCheck()})})();`
}
