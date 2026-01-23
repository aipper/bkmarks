async function getConfig() {
  const cfg = await chrome.storage.local.get(["serverUrl", "username", "password"]);
  return {
    serverUrl: cfg.serverUrl || "",
    username: cfg.username || "",
    password: cfg.password || ""
  };
}

const MIRROR_FOLDER_TITLE = "Bkmarks（来自服务器）";
const MIRROR_PARENT_ID = "2";
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_name",
  "utm_creative_format",
  "utm_marketing_tactic",
  "gclid",
  "fbclid"
];

let suppressSync = false;

function getAuthHeaders(username, password) {
  const headers = { "Content-Type": "application/json" };
  if (username && password) {
    headers["Authorization"] = "Basic " + btoa(username + ":" + password);
  }
  return headers;
}

function normalizeUrl(input) {
  let u;
  try {
    u = new URL(input);
  } catch {
    return String(input || "").trim();
  }
  u.hostname = u.hostname.toLowerCase();
  for (const p of UTM_PARAMS) u.searchParams.delete(p);
  const search = u.searchParams.toString();
  u.search = search ? `?${search}` : "";
  let s = u.toString();
  if (s.endsWith("/") && u.pathname === "/" && !search) s = s.slice(0, -1);
  return s;
}

async function apiGetJson(path) {
  const { serverUrl, username, password } = await getConfig();
  if (!serverUrl) throw new Error("missing_server");
  const endpoint = serverUrl.replace(/\/+$/, "") + path;
  const resp = await fetch(endpoint, {
    method: "GET",
    headers: getAuthHeaders(username, password),
    credentials: "include"
  });
  if (!resp.ok) throw new Error(`http_${resp.status}`);
  return await resp.json();
}

async function sendSync(payload) {
  const { serverUrl, username, password } = await getConfig();
  if (!serverUrl) return false;
  const endpoint = serverUrl.replace(/\/+$/, "") + "/api/bookmarks/sync";
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: getAuthHeaders(username, password),
      body: JSON.stringify(payload),
      credentials: "include"
    });
    return resp.ok;
  } catch (e) {}
  return false;
}

async function fetchDeletedSet() {
  try {
    const data = await apiGetJson("/api/bookmarks/deleted");
    const items = Array.isArray(data?.items) ? data.items : [];
    const set = new Set();
    for (const it of items) {
      if (it?.url) set.add(normalizeUrl(it.url));
    }
    return set;
  } catch {
    return new Set();
  }
}

async function fetchServerBookmarks() {
  const data = await apiGetJson("/api/bookmarks/list");
  return Array.isArray(data?.items) ? data.items : [];
}

function flattenBookmarks(nodes, items) {
  for (const node of nodes || []) {
    if (node.url) {
      items.push({ url: node.url, title: node.title || "" });
    }
    if (node.children && node.children.length) {
      flattenBookmarks(node.children, items);
    }
  }
}

async function fullSync() {
  const tree = await chrome.bookmarks.getTree();
  const items = [];
  flattenBookmarks(tree, items);
  const deleted = await fetchDeletedSet();
  const filtered = items.filter((it) => it?.url && !deleted.has(normalizeUrl(it.url)));
  const ok = await sendSync({
    type: "full",
    items: filtered,
    timestamp: Date.now()
  });
  if (!ok) return { ok: false, error: "全量同步失败" };
  return { ok: true, total: items.length, count: filtered.length, skippedDeleted: items.length - filtered.length };
}

async function ensureMirrorFolderId() {
  const tree = await chrome.bookmarks.getTree();
  const root = tree && tree[0];
  const parent =
    (root?.children || []).find((n) => n.id === MIRROR_PARENT_ID) || (root?.children || [])[0];
  if (!parent) throw new Error("missing_parent");
  const children = await chrome.bookmarks.getChildren(parent.id);
  const existing = (children || []).find((n) => !n.url && n.title === MIRROR_FOLDER_TITLE);
  if (existing) return existing.id;
  const created = await chrome.bookmarks.create({ parentId: parent.id, title: MIRROR_FOLDER_TITLE });
  return created.id;
}

async function writeBack() {
  const items = await fetchServerBookmarks();
  const folderId = await ensureMirrorFolderId();
  suppressSync = true;
  try {
    const children = await chrome.bookmarks.getChildren(folderId);
    for (const c of children || []) {
      await chrome.bookmarks.removeTree(c.id);
    }
    let created = 0;
    for (const it of items) {
      const url = it?.url;
      if (!url) continue;
      const title = String(it?.title || url);
      try {
        await chrome.bookmarks.create({ parentId: folderId, title, url });
        created += 1;
      } catch {}
    }
    return { ok: true, count: created, folderTitle: MIRROR_FOLDER_TITLE };
  } finally {
    suppressSync = false;
  }
}

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (suppressSync) return;
  sendSync({
    type: "created",
    id,
    bookmark,
    timestamp: Date.now()
  });
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  if (suppressSync) return;
  const url = removeInfo?.node?.url;
  sendSync({
    type: "removed",
    id,
    url,
    removeInfo,
    timestamp: Date.now()
  });
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  if (suppressSync) return;
  sendSync({
    type: "changed",
    id,
    changeInfo,
    timestamp: Date.now()
  });
});

chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
  if (suppressSync) return;
  sendSync({
    type: "moved",
    id,
    moveInfo,
    timestamp: Date.now()
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "full_sync") {
    fullSync()
      .then((result) => sendResponse(result))
      .catch(() => sendResponse({ ok: false, error: "全量同步失败" }));
    return true;
  }
  if (message?.type === "write_back") {
    writeBack()
      .then((result) => sendResponse(result))
      .catch(() => sendResponse({ ok: false, error: "回写失败" }));
    return true;
  }
});
