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
            <div id="sidebarTitle" class="section-title">标签</div>
            <div id="sidebarList" class="tags"></div>
          </aside>
          <section class="content">
            <div id="content" class="content-body">
              <div id="bookmarksView">
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

              <div id="profileView" class="page-view hidden">
                <div class="page-header">
                  <div>
                    <div class="page-title">个人中心</div>
                    <div class="page-subtitle">账户与同步概览</div>
                  </div>
                </div>
                <div class="page-grid">
                  <div class="status-card">
                    <div class="card-title">账户信息</div>
                    <div id="profileInfo" class="card-body">加载中...</div>
                  </div>
                  <div class="status-card">
                    <div class="card-title">同步概览</div>
                    <div id="profileStats" class="card-body">加载中...</div>
                  </div>
                </div>
              </div>

              <div id="settingsView" class="page-view hidden">
                <div class="page-header">
                  <div>
                    <div class="page-title">系统设置</div>
                    <div class="page-subtitle">AI 与系统配置</div>
                  </div>
                </div>
                <div class="page-grid">
                  <div class="status-card">
                    <div class="card-title">AI 配置</div>
                    <div id="settingsAi" class="card-body">加载中...</div>
                  </div>
                  <div class="status-card">
                    <div class="card-title">使用策略</div>
                    <div class="card-body">按需手动识别，避免标签噪声。</div>
                  </div>
                </div>
              </div>

              <div id="statusView" class="page-view hidden">
                <div class="page-header">
                  <div>
                    <div class="page-title">系统状态</div>
                    <div class="page-subtitle">同步与 AI 识别情况</div>
                  </div>
                </div>
                <div class="status-grid">
                  <div class="status-card">
                    <div class="card-title">书签统计</div>
                    <div id="statusBookmarks" class="card-body">加载中...</div>
                  </div>
                  <div class="status-card">
                    <div class="card-title">AI 用量</div>
                    <div id="statusAi" class="card-body">加载中...</div>
                  </div>
                </div>
                <div class="status-logs">
                  <div class="status-card">
                    <div class="card-title">AI 识别记录</div>
                    <div id="statusAiLog" class="log-list">暂无记录</div>
                  </div>
                </div>
              </div>

              <div id="tagsView" class="page-view hidden">
                <div class="page-header">
                  <div>
                    <div class="page-title">标签管理</div>
                    <div class="page-subtitle">排序、启用与新增标签</div>
                  </div>
                </div>
                <div class="page-grid">
                  <div class="status-card">
                    <div class="card-title">标签列表</div>
                    <div class="tag-actions">
                      <input id="tagInput" class="tag-input" placeholder="新增标签">
                      <button id="tagAddBtn" class="tag-btn">添加</button>
                    </div>
                    <div id="tagManagerList" class="tag-manager"></div>
                  </div>
                  <div class="status-card">
                    <div class="card-title">AI 候选标签</div>
                    <div id="tagCandidates" class="tag-candidates">暂无候选</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      <div id="tagEditModal" class="modal hidden" role="dialog" aria-modal="true" aria-label="编辑标签">
        <div id="tagEditBackdrop" class="modal-backdrop"></div>
        <div class="modal-card" role="document">
          <div class="modal-header">
            <div class="modal-title">编辑标签</div>
            <button id="tagEditClose" class="icon-button" type="button" aria-label="关闭">×</button>
          </div>
          <div id="tagEditSubtitle" class="modal-subtitle"></div>
          <div class="transfer">
            <div class="transfer-col">
              <div class="transfer-title">可选标签</div>
              <input id="tagEditSearch" class="transfer-search" placeholder="搜索标签">
              <div id="tagEditAvailable" class="transfer-list"></div>
            </div>
            <div class="transfer-controls">
              <button id="tagEditAdd" class="tag-btn" type="button">添加 →</button>
              <button id="tagEditRemove" class="tag-btn" type="button">← 移除</button>
            </div>
            <div class="transfer-col">
              <div class="transfer-title">已选标签</div>
              <div id="tagEditSelected" class="transfer-list"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button id="tagEditCancel" class="ghost-button" type="button">取消</button>
            <button id="tagEditSave" class="primary-button" type="button">保存</button>
          </div>
        </div>
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
  display:block;
  text-decoration:none;
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
.page-view{min-height:60vh}
.page-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin:8px 0 18px;
}
.page-title{
  font-family:"Noto Serif JP","Times New Roman",serif;
  font-size:20px;
  font-weight:600;
}
.page-subtitle{font-size:12px;color:var(--muted)}
.page-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.status-logs{margin-top:16px}
.status-card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  padding:16px;
  box-shadow:var(--shadow-card);
}
.card-title{font-weight:600;font-size:14px;margin-bottom:8px}
.card-body{font-size:13px;color:var(--muted);line-height:1.6}
.log-list{display:flex;flex-direction:column;gap:8px}
.log-item{
  padding:10px 12px;
  border:1px solid rgba(15,23,42,0.08);
  border-radius:12px;
  background:rgba(248,250,252,0.9);
  display:flex;
  flex-direction:column;
  gap:4px;
}
.log-meta{font-size:12px;color:var(--muted)}
.log-tags{font-size:12px;color:#1d4ed8}
.tag-actions{display:flex;gap:8px;margin-bottom:12px}
.tag-input{
  flex:1;
  padding:8px 10px;
  border:1px solid rgba(148,163,184,0.35);
  border-radius:10px;
  background:#f8fafc;
}
.tag-input:focus{outline:none;border-color:rgba(10,132,255,0.65);box-shadow:0 0 0 3px rgba(10,132,255,0.12)}
.tag-btn{
  border:1px solid rgba(37,99,235,0.25);
  background:rgba(37,99,235,0.08);
  color:#1d4ed8;
  border-radius:10px;
  padding:8px 12px;
  font-size:12px;
  font-weight:600;
  cursor:pointer;
}
.tag-btn:hover{border-color:rgba(37,99,235,0.4)}
.tag-manager{display:flex;flex-direction:column;gap:8px}
.tag-row{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 10px;
  border:1px solid rgba(15,23,42,0.08);
  border-radius:12px;
  background:rgba(248,250,252,0.9);
}
.tag-name{flex:1;font-size:13px}
.tag-row button{
  border:1px solid rgba(148,163,184,0.25);
  background:#fff;
  border-radius:8px;
  padding:4px 8px;
  font-size:11px;
  cursor:pointer;
}
.tag-row button:hover{border-color:rgba(37,99,235,0.35)}
.tag-candidates{display:flex;flex-direction:column;gap:8px}
.candidate-row{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 10px;
  border:1px solid rgba(15,23,42,0.08);
  border-radius:12px;
  background:rgba(248,250,252,0.9);
}
.candidate-name{flex:1;font-size:13px}
body.modal-open{overflow:hidden}
.modal{
  position:fixed;
  inset:0;
  z-index:50;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
}
.modal-backdrop{
  position:absolute;
  inset:0;
  background:rgba(15,23,42,0.35);
  backdrop-filter:blur(6px);
}
.modal-card{
  position:relative;
  width:min(860px,100%);
  background:rgba(255,255,255,0.92);
  border:1px solid rgba(148,163,184,0.25);
  border-radius:18px;
  box-shadow:var(--shadow);
  padding:18px;
  backdrop-filter:blur(16px);
}
.modal-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:6px;
}
.modal-title{font-weight:700;font-size:16px}
.modal-subtitle{font-size:12px;color:var(--muted);margin-bottom:14px}
.icon-button{
  width:32px;
  height:32px;
  border-radius:10px;
  border:1px solid rgba(148,163,184,0.25);
  background:rgba(255,255,255,0.85);
  cursor:pointer;
  font-size:16px;
  line-height:1;
}
.icon-button:hover{border-color:rgba(37,99,235,0.35)}
.transfer{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  gap:12px;
  align-items:stretch;
}
.transfer-col{display:flex;flex-direction:column;gap:8px;min-width:0}
.transfer-title{
  font-size:12px;
  font-weight:600;
  color:var(--muted);
  letter-spacing:0.08em;
  text-transform:uppercase;
}
.transfer-search{
  padding:10px 12px;
  border:1px solid rgba(148,163,184,0.35);
  border-radius:12px;
  background:rgba(255,255,255,0.9);
  font-size:13px;
}
.transfer-search:focus{outline:none;border-color:rgba(10,132,255,0.65);box-shadow:0 0 0 3px rgba(10,132,255,0.12)}
.transfer-list{
  min-height:240px;
  max-height:320px;
  overflow:auto;
  border:1px solid rgba(15,23,42,0.08);
  border-radius:14px;
  background:rgba(248,250,252,0.9);
  padding:8px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.transfer-item{
  padding:8px 10px;
  border:1px solid rgba(15,23,42,0.08);
  border-radius:12px;
  background:#fff;
  font-size:13px;
  cursor:pointer;
  user-select:none;
  transition:background 180ms ease,border-color 180ms ease;
}
.transfer-item.selected{
  border-color:rgba(37,99,235,0.35);
  background:rgba(37,99,235,0.08);
}
.transfer-controls{
  display:flex;
  flex-direction:column;
  gap:10px;
  justify-content:center;
}
.modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
  margin-top:14px;
}
.ghost-button{
  border:1px solid rgba(148,163,184,0.25);
  background:rgba(255,255,255,0.92);
  color:var(--text);
  border-radius:12px;
  padding:10px 14px;
  font-weight:600;
  cursor:pointer;
}
.ghost-button:hover{border-color:rgba(37,99,235,0.35)}
.primary-button{
  border:none;
  background:linear-gradient(135deg,var(--primary),var(--primary-strong));
  color:#fff;
  border-radius:12px;
  padding:10px 14px;
  font-weight:600;
  cursor:pointer;
  box-shadow:0 12px 24px rgba(10,132,255,0.25);
}
.primary-button:disabled{opacity:0.7;cursor:default}
@media (max-width:720px){
  .transfer{grid-template-columns:1fr}
  .transfer-controls{flex-direction:row}
}
.nav-item{
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
.nav-item:hover{border-color:rgba(37,99,235,0.35);box-shadow:0 8px 16px rgba(15,23,42,0.08)}
.nav-item.active{
  background:linear-gradient(135deg,var(--primary),var(--primary-strong));
  border-color:var(--primary);
  color:#fff;
  box-shadow:0 12px 24px rgba(10,132,255,0.2);
}
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
body[data-page="profile"] .search-wrap,
body[data-page="settings"] .search-wrap,
body[data-page="status"] .search-wrap{display:none}
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
  return `(function(){const qs=(s)=>document.querySelector(s);const elSidebarTitle=qs('#sidebarTitle');const elSidebarList=qs('#sidebarList');const elList=qs('#list');const elSearch=qs('#search');const elUser=qs('#user');const elRegister=qs('#register');const elLogin=qs('#login');const elRU=qs('#ru');const elRP=qs('#rp');const elRegisterBtn=qs('#registerBtn');const elU=qs('#u');const elP=qs('#p');const elLoginBtn=qs('#loginBtn');const elBookmarksView=qs('#bookmarksView');const elProfileView=qs('#profileView');const elSettingsView=qs('#settingsView');const elStatusView=qs('#statusView');const elTagsView=qs('#tagsView');const elProfileInfo=qs('#profileInfo');const elProfileStats=qs('#profileStats');const elSettingsAi=qs('#settingsAi');const elStatusBookmarks=qs('#statusBookmarks');const elStatusAi=qs('#statusAi');const elStatusAiLog=qs('#statusAiLog');const elTagInput=qs('#tagInput');const elTagAddBtn=qs('#tagAddBtn');const elTagManagerList=qs('#tagManagerList');const elTagCandidates=qs('#tagCandidates');let items=[];let tagList=[];let activeTag='全部';let menuOpen=false;let currentUser=null;function hostFrom(url){try{return new URL(url).hostname}catch{return''}}function originFrom(url){try{return new URL(url).origin}catch{return''}}function formatTime(ts){if(!ts)return'-';try{return new Date(ts).toLocaleString()}catch{return'-'}}function pageFromPath(){let path=location.pathname||'';while(path.length>1&&path.endsWith('/'))path=path.slice(0,-1);if(path==='/app'||path==='')return'bookmarks';const parts=path.split('/');return parts[2]||'bookmarks'}function closeMenu(){const menu=elUser.querySelector('.user-menu');const trigger=elUser.querySelector('.user-trigger');if(menu)menu.classList.remove('open');if(trigger)trigger.setAttribute('aria-expanded','false');menuOpen=false}function openMenu(){const menu=elUser.querySelector('.user-menu');const trigger=elUser.querySelector('.user-trigger');if(menu)menu.classList.add('open');if(trigger)trigger.setAttribute('aria-expanded','true');menuOpen=true}function toggleMenu(){menuOpen?closeMenu():openMenu()}function setUserMenu(username){elUser.innerHTML='<button class="user-trigger" type="button" aria-haspopup="true" aria-expanded="false">'+username+'</button><div class="user-menu" role="menu"><a class="menu-item" href="/app/profile">个人中心</a><a class="menu-item" href="/app/settings">系统设置</a><a class="menu-item" href="/app/status">系统状态</a><a class="menu-item" href="/app/tags">标签管理</a><button class="menu-item" type="button" data-action="logout">退出登录</button></div>';const trigger=elUser.querySelector('.user-trigger');trigger.addEventListener('click',(e)=>{e.stopPropagation();toggleMenu()});const logout=elUser.querySelector('[data-action="logout"]');if(logout)logout.addEventListener('click',async(e)=>{e.preventDefault();e.stopPropagation();try{await fetch('/api/auth/logout',{method:'POST'})}finally{location.href='/app'}});document.addEventListener('click',(e)=>{if(!elUser.contains(e.target))closeMenu()})}function renderSidebarMenu(page){if(!elSidebarTitle||!elSidebarList)return;if(page==='bookmarks'){elSidebarTitle.textContent='标签';renderTags();return}elSidebarTitle.textContent='个人中心';elSidebarList.innerHTML='';const nav=[{id:'profile',label:'个人中心',href:'/app/profile'},{id:'settings',label:'系统设置',href:'/app/settings'},{id:'status',label:'系统状态',href:'/app/status'},{id:'tags',label:'标签管理',href:'/app/tags'}];nav.forEach((it)=>{const a=document.createElement('a');a.className='nav-item'+(page===it.id?' active':'');a.href=it.href;a.textContent=it.label;elSidebarList.appendChild(a)})}function setPage(page){document.body.dataset.page=page;elBookmarksView.classList.toggle('hidden',page!=='bookmarks');elProfileView.classList.toggle('hidden',page!=='profile');elSettingsView.classList.toggle('hidden',page!=='settings');elStatusView.classList.toggle('hidden',page!=='status');elTagsView.classList.toggle('hidden',page!=='tags');renderSidebarMenu(page);if(page==='profile')loadProfile();if(page==='settings')loadSettings();if(page==='status')loadStatus();if(page==='tags')loadTagManager()}async function loadProfile(){if(!currentUser){elProfileInfo.textContent='请先登录';elProfileStats.textContent='-';return}elProfileInfo.innerHTML='<div><strong>用户名：</strong>'+currentUser.username+'</div><div><strong>角色：</strong>'+(currentUser.role||'user')+'</div>';try{const r=await fetch('/api/system/status');if(!r.ok)throw new Error('bad');const j=await r.json();const b=j.bookmarks||{};elProfileStats.innerHTML='<div><strong>书签总数：</strong>'+(b.total??0)+'</div><div><strong>最近同步：</strong>'+formatTime(b.updatedAt)+'</div><div><strong>最近 AI 识别：</strong>'+formatTime(b.lastAiAt)+'</div>'}catch{elProfileStats.textContent='无法获取数据'}}async function loadSettings(){try{const r=await fetch('/api/config');if(!r.ok)throw new Error('bad');const j=await r.json();const ai=j.ai_enabled?'开启':'关闭';const g=j.limits?.global??'-';const u=j.limits?.user??'-';elSettingsAi.innerHTML='<div><strong>AI：</strong>'+ai+'</div><div><strong>全局限额：</strong>'+g+'</div><div><strong>用户限额：</strong>'+u+'</div>'}catch{elSettingsAi.textContent='无法获取配置'}}async function loadStatus(){try{const r=await fetch('/api/system/status');if(!r.ok)throw new Error('bad');const j=await r.json();const b=j.bookmarks||{};const ai=j.ai||{};const usage=ai.usage||{};elStatusBookmarks.innerHTML='<div><strong>书签总数：</strong>'+(b.total??0)+'</div><div><strong>已 AI 识别：</strong>'+(b.aiTagged??0)+'</div><div><strong>最近同步：</strong>'+formatTime(b.updatedAt)+'</div><div><strong>最近 AI 识别：</strong>'+formatTime(b.lastAiAt)+'</div>';elStatusAi.innerHTML='<div><strong>AI 状态：</strong>'+(ai.enabled?'开启':'关闭')+'</div><div><strong>今日用量：</strong>'+(usage.userUsed??0)+' / '+(ai.limits?.user??'-')+'</div><div><strong>全局用量：</strong>'+(usage.globalUsed??0)+' / '+(ai.limits?.global??'-')+'</div>';const logs=(ai.logs||[]);if(!logs.length){elStatusAiLog.textContent='暂无记录';return}elStatusAiLog.innerHTML='';logs.slice(0,12).forEach((it)=>{const row=document.createElement('div');row.className='log-item';const title=document.createElement('div');title.textContent=it.title||it.url;const meta=document.createElement('div');meta.className='log-meta';meta.textContent=formatTime(it.at);const tags=document.createElement('div');tags.className='log-tags';tags.textContent=(it.tags||[]).join(' · ');row.appendChild(title);row.appendChild(meta);row.appendChild(tags);elStatusAiLog.appendChild(row)})}catch{elStatusBookmarks.textContent='无法获取状态';elStatusAi.textContent='-';elStatusAiLog.textContent='暂无记录'}}async function fetchTags(){try{const r=await fetch('/api/tags');if(!r.ok)throw new Error('bad');const j=await r.json();tagList=(j.tags||[]).slice().sort((a,b)=>a.order-b.order);renderTags()}catch{tagList=[];renderTags()}}async function saveTags(){const payload={tags:tagList.map((t)=>({name:t.name,enabled:!!t.enabled}))};await fetch('/api/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});renderTags()}function renderTagManager(){if(!elTagManagerList)return;elTagManagerList.innerHTML='';tagList.forEach((t,idx)=>{const row=document.createElement('div');row.className='tag-row';const name=document.createElement('div');name.className='tag-name';name.textContent=t.name;const toggle=document.createElement('button');toggle.textContent=t.enabled?'显示':'隐藏';toggle.addEventListener('click',()=>{t.enabled=!t.enabled;saveTags();renderTagManager()});const up=document.createElement('button');up.textContent='上移';up.addEventListener('click',()=>{if(idx===0)return;tagList.splice(idx-1,0,tagList.splice(idx,1)[0]);saveTags();renderTagManager()});const down=document.createElement('button');down.textContent='下移';down.addEventListener('click',()=>{if(idx===tagList.length-1)return;tagList.splice(idx+1,0,tagList.splice(idx,1)[0]);saveTags();renderTagManager()});const del=document.createElement('button');del.textContent='删除';del.addEventListener('click',()=>{tagList.splice(idx,1);saveTags();renderTagManager()});row.appendChild(name);row.appendChild(toggle);row.appendChild(up);row.appendChild(down);row.appendChild(del);elTagManagerList.appendChild(row)})}async function loadTagCandidates(){if(!elTagCandidates)return;try{const r=await fetch('/api/tags/candidates');if(!r.ok)throw new Error('bad');const j=await r.json();const arr=j.tags||[];if(!arr.length){elTagCandidates.textContent='暂无候选';return}elTagCandidates.innerHTML='';arr.forEach((name)=>{const row=document.createElement('div');row.className='candidate-row';const label=document.createElement('div');label.className='candidate-name';label.textContent=name;const btn=document.createElement('button');btn.className='tag-btn';btn.textContent='加入';btn.addEventListener('click',()=>{const existing=tagList.find((t)=>t.name===name);if(existing){existing.enabled=true}else{tagList.push({name,enabled:true,order:tagList.length})}saveTags();renderTagManager();loadTagCandidates()});row.appendChild(label);row.appendChild(btn);elTagCandidates.appendChild(row)})}catch{elTagCandidates.textContent='暂无候选'}}function loadTagManager(){renderTagManager();loadTagCandidates()}function renderTags(){if(!elSidebarList)return;const counts=new Map();items.forEach((it)=>{(it.tags||[]).forEach((t)=>counts.set(t,(counts.get(t)||0)+1))});const list=tagList.filter((t)=>t.enabled);elSidebarList.innerHTML='';const allBtn=document.createElement('button');allBtn.className='pill'+(activeTag==='全部'?' active':'');allBtn.textContent='全部';allBtn.onclick=()=>{activeTag='全部';renderList()};elSidebarList.appendChild(allBtn);list.forEach((t)=>{const d=document.createElement('button');d.className='pill'+(t.name===activeTag?' active':'');const count=counts.get(t.name)||0;d.textContent=t.name+(count?(' ('+count+')'):'');d.onclick=()=>{activeTag=t.name;renderList()};elSidebarList.appendChild(d)})}async function runAi(it,btn){if(btn.disabled)return;btn.classList.add('loading');btn.textContent='识别中';try{const r=await fetch('/api/ai/classify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:it.url,title:it.title||''})});if(!r.ok)throw new Error('bad');await fetchItems()}catch{btn.textContent='重试';btn.classList.remove('loading')}}let tagEditState=null;let tagEditInit=false;function tagEditEls(){return{modal:document.getElementById('tagEditModal'),backdrop:document.getElementById('tagEditBackdrop'),close:document.getElementById('tagEditClose'),cancel:document.getElementById('tagEditCancel'),save:document.getElementById('tagEditSave'),add:document.getElementById('tagEditAdd'),remove:document.getElementById('tagEditRemove'),search:document.getElementById('tagEditSearch'),subtitle:document.getElementById('tagEditSubtitle'),available:document.getElementById('tagEditAvailable'),selected:document.getElementById('tagEditSelected')}}function closeTagEditor(){const el=tagEditEls();if(el.modal)el.modal.classList.add('hidden');document.body.classList.remove('modal-open');tagEditState=null}function renderTagEditor(){const el=tagEditEls();if(!tagEditState||!el.modal)return;const q=(tagEditState.q||'').toLowerCase();const order=new Map((tagList||[]).map((t,i)=>[t.name,i]));const all=(tagList||[]).map(t=>t.name);const avail=all.filter(n=>!tagEditState.sel.has(n)).filter(n=>!q||n.toLowerCase().includes(q));if(el.subtitle)el.subtitle.textContent=(tagEditState.title||'')+' · '+(hostFrom(tagEditState.url)||'');if(el.available){el.available.innerHTML='';avail.forEach(n=>{const d=document.createElement('div');d.className='transfer-item'+(tagEditState.pickL.has(n)?' selected':'');d.textContent=n;d.addEventListener('click',()=>{tagEditState.pickL.has(n)?tagEditState.pickL.delete(n):tagEditState.pickL.add(n);renderTagEditor()});d.addEventListener('dblclick',()=>{tagEditState.sel.add(n);tagEditState.pickL.delete(n);renderTagEditor()});el.available.appendChild(d)})}const selArr=Array.from(tagEditState.sel).sort((a,b)=>((order.get(a)??1e9)-(order.get(b)??1e9))||a.localeCompare(b,'zh-Hans-CN'));if(el.selected){el.selected.innerHTML='';selArr.forEach(n=>{const d=document.createElement('div');d.className='transfer-item'+(tagEditState.pickR.has(n)?' selected':'');d.textContent=n;d.addEventListener('click',()=>{tagEditState.pickR.has(n)?tagEditState.pickR.delete(n):tagEditState.pickR.add(n);renderTagEditor()});d.addEventListener('dblclick',()=>{tagEditState.sel.delete(n);tagEditState.pickR.delete(n);renderTagEditor()});el.selected.appendChild(d)})}}async function saveTagEditor(){const el=tagEditEls();if(!tagEditState)return;const selArr=Array.from(tagEditState.sel);if(el.save)el.save.disabled=true;try{await fetch('/api/bookmarks/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:tagEditState.url,tags:selArr})});closeTagEditor();await fetchItems()}catch{alert('保存失败')}finally{if(el.save)el.save.disabled=false}}function ensureTagEditor(){if(tagEditInit)return;tagEditInit=true;const el=tagEditEls();if(!el.modal)return;const close=()=>closeTagEditor();[el.backdrop,el.close,el.cancel].forEach((b)=>b&&b.addEventListener('click',close));if(el.search)el.search.addEventListener('input',()=>{if(!tagEditState)return;tagEditState.q=el.search.value||'';renderTagEditor()});if(el.add)el.add.addEventListener('click',()=>{if(!tagEditState)return;tagEditState.pickL.forEach(n=>tagEditState.sel.add(n));tagEditState.pickL.clear();renderTagEditor()});if(el.remove)el.remove.addEventListener('click',()=>{if(!tagEditState)return;tagEditState.pickR.forEach(n=>tagEditState.sel.delete(n));tagEditState.pickR.clear();renderTagEditor()});if(el.save)el.save.addEventListener('click',()=>saveTagEditor());document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&tagEditState)closeTagEditor()})}function openTagEditor(it){ensureTagEditor();const el=tagEditEls();if(!el.modal)return;tagEditState={url:it.url,title:it.title||it.url,sel:new Set(it.manualTags||[]),pickL:new Set(),pickR:new Set(),q:''};document.body.classList.add('modal-open');el.modal.classList.remove('hidden');if(el.search)el.search.value='';renderTagEditor();if(el.search)el.search.focus()}function renderList(){if(!elList)return;const q=(elSearch.value||'').toLowerCase();const filtered=items.filter(it=>{const inTag=activeTag==='全部'||(it.tags||[]).includes(activeTag);const str=(it.title||'')+' '+(it.url||'');const inSearch=str.toLowerCase().includes(q);return inTag&&inSearch});elList.innerHTML='';filtered.forEach(it=>{const card=document.createElement('div');card.className='card';card.tabIndex=0;card.setAttribute('role','link');card.setAttribute('aria-label',it.title||it.url);card.addEventListener('click',(e)=>{if(e.target.closest('.ai-btn'))return;window.open(it.url,'_blank')});card.addEventListener('keydown',(e)=>{if(e.key==='Enter')window.open(it.url,'_blank')});const dot=document.createElement('div');dot.className='status-dot '+((it.status==='ok')?'status-ok':'status-bad');const head=document.createElement('div');head.className='card-head';const fav=document.createElement('div');fav.className='favicon';const host=hostFrom(it.url);const origin=originFrom(it.url);const img=document.createElement('img');img.alt=host;img.src=origin?(origin+'/favicon.ico'):'';img.onerror=()=>{if(img.dataset.fallback)return;img.dataset.fallback='1';img.src=host?('https://www.google.com/s2/favicons?domain='+host+'&sz=64'):''};fav.appendChild(img);const t=document.createElement('div');t.className='title';t.textContent=it.title||it.url;head.appendChild(fav);head.appendChild(t);const meta=document.createElement('div');meta.className='meta';const u=document.createElement('div');u.className='url';u.textContent=host||it.url;const st=document.createElement('div');st.className='status-label';st.textContent=(it.status==='ok')?'可用':'需检查';const editBtn=document.createElement('button');editBtn.type='button';editBtn.className='ai-btn';editBtn.textContent='编辑标签';editBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();openTagEditor(it)});const aiBtn=document.createElement('button');aiBtn.type='button';aiBtn.className='ai-btn';if(it.aiCheckedAt){aiBtn.textContent='已识别';aiBtn.disabled=true}else{aiBtn.textContent='AI识别';aiBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();runAi(it,aiBtn)})}meta.appendChild(u);meta.appendChild(st);meta.appendChild(editBtn);meta.appendChild(aiBtn);const tg=document.createElement('div');tg.className='tags-row';(it.tags||[]).slice(0,3).forEach(tag=>{const s=document.createElement('span');s.className='tag';s.textContent=tag;tg.appendChild(s)});card.appendChild(dot);card.appendChild(head);card.appendChild(meta);card.appendChild(tg);elList.appendChild(card)})}function showLogin(){elLogin.classList.remove('hidden');elRegister.classList.add('hidden')}function showRegister(){elRegister.classList.remove('hidden');elLogin.classList.add('hidden')}async function fetchRegistration(){const r=await fetch('/api/auth/registration');if(r.status===200){const j=await r.json();if(j.open){showRegister();return true}}showLogin();return false}async function fetchMe(){const r=await fetch('/api/auth/me');if(r.status===200){const j=await r.json();currentUser=j.user;setUserMenu(j.user.username);document.body.classList.remove('login');elLogin.classList.add('hidden');elRegister.classList.add('hidden');setPage(pageFromPath());return true}else{elUser.textContent='未登录';document.body.classList.add('login');await fetchRegistration();if(pageFromPath()!=='bookmarks'){location.href='/app'}return false}}async function fetchItems(){const r=await fetch('/api/bookmarks/list');if(r.status!==200){items=[];renderTags();renderList();return}const j=await r.json();items=j.items||[];renderTags();renderList()}async function runCheck(){await fetch('/api/links/check?limit=20',{method:'POST'});await fetchItems()}if(elSearch){elSearch.addEventListener('input',renderList)}if(elTagAddBtn){elTagAddBtn.addEventListener('click',()=>{const name=(elTagInput.value||'').trim();if(!name)return;if(tagList.find((t)=>t.name===name))return;tagList.push({name,enabled:true,order:tagList.length});elTagInput.value='';saveTags();renderTagManager()})}elRegisterBtn.addEventListener('click',async()=>{const username=elRU.value.trim();const password=elRP.value;if(!username||!password)return;const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});if(r.status===200){showLogin()}});elLoginBtn.addEventListener('click',async()=>{const username=elU.value.trim();const password=elP.value;if(!username||!password)return;const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});if(r.status===200){elLogin.classList.add('hidden');elRegister.classList.add('hidden');document.body.classList.remove('login');fetchMe().then(()=>{fetchItems();runCheck();fetchTags()})}});fetchMe().then(()=>{fetchItems();runCheck();fetchTags()})})();`
}
