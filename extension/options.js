async function load() {
  const cfg = await chrome.storage.local.get(["serverUrl", "username", "password"]);
  document.getElementById("serverUrl").value = cfg.serverUrl || "";
  document.getElementById("username").value = cfg.username || "";
  document.getElementById("password").value = cfg.password || "";
}

function setStatus(message, tone) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = message || "";
  el.className = ["status", tone].filter(Boolean).join(" ");
}

function setStats(text) {
  const el = document.getElementById("stats");
  if (!el) return;
  el.textContent = text;
}

function getAuthHeaders(username, password) {
  const headers = {};
  if (username && password) {
    headers["Authorization"] = "Basic " + btoa(username + ":" + password);
  }
  return headers;
}

async function fetchBookmarkCount(serverUrl, username, password) {
  if (!serverUrl) {
    setStats("已同步书签：-");
    return;
  }
  const endpoint = serverUrl.replace(/\/+$/, "") + "/api/bookmarks/list";
  try {
    const resp = await fetch(endpoint, {
      headers: getAuthHeaders(username, password),
      credentials: "include"
    });
    if (!resp.ok) {
      setStats("已同步书签：未获取");
      return;
    }
    const data = await resp.json();
    const count = Array.isArray(data?.items) ? data.items.length : 0;
    setStats(`已同步书签：${count}`);
  } catch {
    setStats("已同步书签：未获取");
  }
}

async function save() {
  const serverUrl = document.getElementById("serverUrl").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  await chrome.storage.local.set({ serverUrl, username, password });
  setStatus("已保存", "ok");
  fetchBookmarkCount(serverUrl, username, password);
}

async function testConnection() {
  const serverUrl = document.getElementById("serverUrl").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!serverUrl) {
    setStatus("请先填写服务端地址", "error");
    return;
  }
  const endpoint = serverUrl.replace(/\/+$/, "") + "/api/bookmarks/list";
  setStatus("正在测试连接...", "pending");
  try {
    const resp = await fetch(endpoint, {
      headers: getAuthHeaders(username, password),
      credentials: "include"
    });
    if (resp.ok) {
      const data = await resp.json();
      const count = Array.isArray(data?.items) ? data.items.length : 0;
      setStatus("连接成功", "ok");
      setStats(`已同步书签：${count}`);
    } else if (resp.status === 401) {
      setStatus("鉴权失败，请检查用户名/密码", "error");
      setStats("已同步书签：未获取");
    } else {
      setStatus(`连接失败（HTTP ${resp.status}）`, "error");
      setStats("已同步书签：未获取");
    }
  } catch {
    setStatus("连接失败，请检查服务端地址或网络", "error");
    setStats("已同步书签：未获取");
  }
}

async function requestFullSync() {
  const serverUrl = document.getElementById("serverUrl").value.trim();
  if (!serverUrl) {
    setStatus("请先填写服务端地址", "error");
    return;
  }
  setStatus("正在提交全量同步...", "pending");
  try {
    const resp = await chrome.runtime.sendMessage({ type: "full_sync" });
    if (resp?.ok) {
      const countText = Number.isFinite(resp.count) ? `（${resp.count}条）` : "";
      setStatus(`已提交全量同步${countText}`, "ok");
      fetchBookmarkCount(
        document.getElementById("serverUrl").value.trim(),
        document.getElementById("username").value.trim(),
        document.getElementById("password").value
      );
    } else {
      setStatus(resp?.error || "全量同步失败", "error");
    }
  } catch {
    setStatus("无法触发全量同步", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  document.getElementById("save").addEventListener("click", save);
  document.getElementById("test").addEventListener("click", testConnection);
  document.getElementById("fullSync").addEventListener("click", requestFullSync);
  chrome.storage.local.get(["serverUrl", "username", "password"]).then((cfg) => {
    fetchBookmarkCount(cfg.serverUrl || "", cfg.username || "", cfg.password || "");
  });
});
