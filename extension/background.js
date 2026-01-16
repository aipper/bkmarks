async function getConfig() {
  const cfg = await chrome.storage.local.get(["serverUrl", "username", "password"]);
  return {
    serverUrl: cfg.serverUrl || "",
    username: cfg.username || "",
    password: cfg.password || ""
  };
}

async function sendSync(payload) {
  const { serverUrl, username, password } = await getConfig();
  if (!serverUrl) return;
  const endpoint = serverUrl.replace(/\/+$/, "") + "/api/bookmarks/sync";
  const headers = { "Content-Type": "application/json" };
  if (username && password) {
    headers["Authorization"] = "Basic " + btoa(username + ":" + password);
  }
  try {
    await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      credentials: "include"
    });
  } catch (e) {}
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
  await sendSync({
    type: "full",
    items,
    timestamp: Date.now()
  });
  return { ok: true, count: items.length };
}

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  sendSync({
    type: "created",
    id,
    bookmark,
    timestamp: Date.now()
  });
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  chrome.bookmarks.get(id, (nodes) => {
    const node = nodes && nodes[0]
    const url = node && node.url
    sendSync({
      type: "removed",
      id,
      url,
      removeInfo,
      timestamp: Date.now()
    });
  })
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  sendSync({
    type: "changed",
    id,
    changeInfo,
    timestamp: Date.now()
  });
});

chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
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
});
