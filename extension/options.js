async function load() {
  const cfg = await chrome.storage.local.get(["serverUrl", "username", "password"]);
  document.getElementById("serverUrl").value = cfg.serverUrl || "";
  document.getElementById("username").value = cfg.username || "";
  document.getElementById("password").value = cfg.password || "";
}

async function save() {
  const serverUrl = document.getElementById("serverUrl").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  await chrome.storage.local.set({ serverUrl, username, password });
  alert("已保存");
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  document.getElementById("save").addEventListener("click", save);
});
