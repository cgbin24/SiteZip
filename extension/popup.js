/* SiteZip · popup.js v1.2
 * 两步式流程：
 *   1) 扫描：chrome.debugger + Page.getResourceTree 枚举「源代码/来源」资源树，
 *            并叠加 DOM / CSS / 样式表解析补全，得到统一资源清单
 *   2) 打包：多重回退抓取内容（DevTools 协议 → 页面上下文 fetch → 弹窗 fetch），
 *            压缩为 ZIP 并以「数据 URL 优先」方式稳健下载
 */

const els = {
  host: document.getElementById("siteHost"),
  url: document.getElementById("siteUrl"),

  stageScan: document.getElementById("stageScan"),
  stageList: document.getElementById("stageList"),

  scanBtn: document.getElementById("scanBtn"),
  rescanBtn: document.getElementById("rescanBtn"),
  startBtn: document.getElementById("startBtn"),
  runTxt: document.querySelector(".run-txt"),

  optTree: document.getElementById("optTree"),
  optDom: document.getElementById("optDom"),
  optRendered: document.getElementById("optRendered"),
  optSourceMap: document.getElementById("optSourceMap"),

  typeChips: document.getElementById("typeChips"),
  hostChips: document.getElementById("hostChips"),
  searchInput: document.getElementById("searchInput"),

  statSel: document.getElementById("statSel"),
  statTotal: document.getElementById("statTotal"),
  statSize: document.getElementById("statSize"),

  resList: document.getElementById("resList"),
  progressBox: document.getElementById("progressBox"),
  barFill: document.getElementById("barFill"),
  pct: document.getElementById("progressPct"),
  count: document.getElementById("progressCount"),
  log: document.getElementById("log"),

  themeToggle: document.getElementById("themeToggle"),
};

const TYPE_LABEL = {
  html: "HTML",
  css: "CSS",
  js: "JS",
  image: "图片",
  font: "字体",
  media: "媒体",
  json: "JSON",
  other: "其他",
};
const TYPE_ORDER = ["html", "css", "js", "image", "font", "media", "json", "other"];

const THEMES = ["dark", "light", "green"];
const THEME_LABEL = { dark: "深色", light: "浅色", green: "护眼" };

// 全局状态
const state = {
  activeTab: null,
  primaryHost: "",
  renderedHtml: "",
  resources: [], // {id, url, host, path, type, source, frameId?, requestId?, selected}
  typeFilter: new Set(TYPE_ORDER),
  hostFilter: new Set(),
  dbgAttached: false, // 扫描后保持调试器连接，供打包阶段用 requestId 取内容
};

// 网络监听：捕获「源代码/来源」面板里全部（含异步/动态）已加载资源
const net = {
  byReqId: new Map(), // requestId -> {url, type, mimeType, frameId}
  inflight: new Set(),
  loadFired: false,
};

initTheme();
init();

/* ---------- 主题 ---------- */
async function initTheme() {
  let theme = "dark";
  try {
    const s = await chrome.storage?.local.get("sz_theme");
    if (s && THEMES.includes(s.sz_theme)) theme = s.sz_theme;
  } catch {}
  applyTheme(theme);
  els.themeToggle?.addEventListener("click", cycleTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (els.themeToggle) els.themeToggle.textContent = THEME_LABEL[theme] || "深色";
  els.themeToggle?.setAttribute("data-theme-value", theme);
}

async function cycleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  try {
    await chrome.storage?.local.set({ sz_theme: next });
  } catch {}
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.activeTab = tab;
  if (!tab || !/^https?:/i.test(tab.url || "")) {
    els.host.textContent = "不支持的页面";
    els.url.textContent = "请在普通网页 (http/https) 上使用";
    els.scanBtn.disabled = true;
    return;
  }
  const u = new URL(tab.url);
  state.primaryHost = u.hostname;
  els.host.textContent = u.hostname;
  els.url.textContent = tab.url;

  els.scanBtn.addEventListener("click", handleScan);
  els.rescanBtn.addEventListener("click", handleRescan);
  els.startBtn.addEventListener("click", handlePack);
  els.searchInput.addEventListener("input", renderList);

  // 调试器网络事件监听（全局仅注册一次）
  chrome.debugger?.onEvent.addListener(onDbgEvent);
  chrome.debugger?.onDetach.addListener((src) => {
    if (state.activeTab && src.tabId === state.activeTab.id) state.dbgAttached = false;
  });
  window.addEventListener("unload", () => {
    if (state.dbgAttached && state.activeTab) chrome.debugger.detach({ tabId: state.activeTab.id }, () => {});
  });

  document.querySelectorAll(".bulk-btn").forEach((b) => {
    b.addEventListener("click", () => handleBulk(b.dataset.bulk));
  });
}

/* ---------- 网络监听 & 加载完成检测 ---------- */
function onDbgEvent(source, method, params) {
  if (!state.activeTab || source.tabId !== state.activeTab.id) return;
  switch (method) {
    case "Network.requestWillBeSent": {
      const { requestId, request, type, frameId } = params;
      if (request && /^https?:/i.test(request.url)) {
        net.inflight.add(requestId);
        const prev = net.byReqId.get(requestId) || {};
        net.byReqId.set(requestId, {
          ...prev,
          url: request.url,
          type: type || prev.type,
          frameId: frameId || prev.frameId,
        });
      }
      break;
    }
    case "Network.responseReceived": {
      const { requestId, response, type, frameId } = params;
      if (response && /^https?:/i.test(response.url)) {
        const prev = net.byReqId.get(requestId) || {};
        net.byReqId.set(requestId, {
          ...prev,
          url: response.url,
          type: type || prev.type,
          mimeType: response.mimeType,
          frameId: frameId || prev.frameId,
        });
      }
      break;
    }
    case "Network.loadingFinished":
    case "Network.loadingFailed":
      net.inflight.delete(params.requestId);
      break;
    case "Page.loadEventFired":
      net.loadFired = true;
      break;
  }
}

function resetNet() {
  net.byReqId.clear();
  net.inflight.clear();
  net.loadFired = false;
}

// 等待页面 load 事件 + 网络空闲，从而完整捕获异步/动态加载的资源
function waitForLoadAndIdle({ requireLoad = true, quietMs = 1500, maxWaitMs = 25000 } = {}) {
  const start = Date.now();
  let lastBusy = Date.now();
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      if (net.inflight.size > 0) lastBusy = Date.now();
      const quiet = Date.now() - lastBusy >= quietMs && net.inflight.size === 0;
      const loadOk = requireLoad ? net.loadFired : true;
      if ((loadOk && quiet) || elapsed >= maxWaitMs) {
        clearInterval(timer);
        resolve();
      }
    }, 250);
  });
}

/* ---------- 通用工具 ---------- */
function log(msg, cls = "") {
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = msg;
  els.log.appendChild(line);
  els.log.scrollTop = els.log.scrollHeight;
}

function setProgress(done, total) {
  els.progressBox.hidden = false;
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.barFill.style.width = pct + "%";
  els.pct.textContent = pct + "%";
  els.count.textContent = `${done}/${total}`;
}

function hideProgress() {
  els.progressBox.hidden = true;
  els.barFill.style.width = "0%";
  els.pct.textContent = "0%";
  els.count.textContent = "";
}

function sendCommand(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (res) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(res);
    });
  });
}

function attach(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, "1.3", () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

function detach(tabId) {
  return new Promise((resolve) => chrome.debugger.detach({ tabId }, () => resolve()));
}

function guessType(url, hintType) {
  if (hintType) {
    const t = String(hintType).toLowerCase();
    if (t === "document") return "html";
    if (t === "stylesheet") return "css";
    if (t === "script") return "js";
    if (t === "image") return "image";
    if (t === "font") return "font";
    if (t === "media") return "media";
    if (t === "manifest") return "json";
    // fetch / xhr / other → 靠扩展名兜底
  }
  const clean = url.split("#")[0].split("?")[0].toLowerCase();
  const ext = clean.slice(clean.lastIndexOf(".") + 1);
  if (["html", "htm", "xhtml", "shtml"].includes(ext)) return "html";
  if (["css", "scss", "less"].includes(ext)) return "css";
  if (["js", "mjs", "cjs", "jsx", "ts", "tsx"].includes(ext)) return "js";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "avif", "bmp", "apng"].includes(ext)) return "image";
  if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) return "font";
  if (["mp4", "webm", "ogg", "ogv", "mp3", "wav", "m4a", "mov", "flac", "aac"].includes(ext)) return "media";
  if (["json", "map", "webmanifest", "xml"].includes(ext)) return "json";
  return "other";
}

function urlToPath(rawUrl) {
  try {
    const u = new URL(rawUrl);
    let pathname = decodeURIComponent(u.pathname);
    if (pathname === "" || pathname.endsWith("/")) pathname += "index.html";
    // 无扩展名的路径末段（可能是路由/文档），补 .html
    const last = pathname.slice(pathname.lastIndexOf("/") + 1);
    if (last && !last.includes(".")) pathname += ".html";
    let path = u.hostname + pathname;
    if (u.search) {
      const dot = path.lastIndexOf(".");
      const hash = "_" + hashStr(u.search);
      path = dot > path.lastIndexOf("/") ? path.slice(0, dot) + hash + path.slice(dot) : path + hash;
    }
    // 逐段清洗非法字符，去掉前导斜杠
    path = path
      .split("/")
      .map((seg) => seg.replace(/[\\:*?"<>|]/g, "_").trim())
      .filter(Boolean)
      .join("/");
    return path || "misc/" + hashStr(rawUrl) + ".bin";
  } catch {
    return "misc/" + hashStr(rawUrl) + ".bin";
  }
}

// 路径冲突去重（同一路径写第二次时追加序号）
function uniquePath(path, written) {
  if (!written.has(path)) return path;
  const dot = path.lastIndexOf(".");
  const slash = path.lastIndexOf("/");
  const base = dot > slash ? path.slice(0, dot) : path;
  const ext = dot > slash ? path.slice(dot) : "";
  let i = 1;
  let candidate;
  do {
    candidate = `${base}(${i})${ext}`;
    i++;
  } while (written.has(candidate));
  return candidate;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function walkFrameTree(node, out) {
  const frameId = node.frame.id;
  if (node.frame.url && /^https?:/i.test(node.frame.url)) {
    out.push({ frameId, url: node.frame.url, type: "Document" });
  }
  for (const r of node.resources || []) {
    if (/^https?:/i.test(r.url)) out.push({ frameId, url: r.url, type: r.type });
  }
  for (const c of node.childFrames || []) walkFrameTree(c, out);
}

/* ---------- 源码映射（Source Map）还原 ---------- */
// 在页面上下文抓取文本内容（复用凭据，绕过 CORS）
async function fetchTextInPage(tabId, url) {
  try {
    const [inj] = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (u) => {
        try {
          const resp = await fetch(u, { credentials: "include" });
          if (!resp.ok) return null;
          return await resp.text();
        } catch {
          return null;
        }
      },
      args: [url],
    });
    return inj?.result ?? null;
  } catch {
    return null;
  }
}

function findSourceMapUrl(text, baseUrl) {
  if (!text) return null;
  const m = text.match(/[#@]\s*sourceMappingURL=([^\s'"]+)\s*$/m);
  if (!m) return null;
  const ref = m[1].trim();
  if (ref.startsWith("data:")) return ref; // 内联 map
  try {
    return new URL(ref, baseUrl).href;
  } catch {
    return null;
  }
}

async function fetchMapText(tabId, mapRef) {
  if (mapRef.startsWith("data:")) {
    try {
      const comma = mapRef.indexOf(",");
      const meta = mapRef.slice(5, comma);
      const data = mapRef.slice(comma + 1);
      if (/base64/i.test(meta)) {
        const bin = atob(data);
        try {
          return decodeURIComponent(escape(bin));
        } catch {
          return bin;
        }
      }
      return decodeURIComponent(data);
    } catch {
      return null;
    }
  }
  let t = await fetchTextInPage(tabId, mapRef);
  if (t == null) {
    try {
      const r = await fetch(mapRef);
      if (r.ok) t = await r.text();
    } catch {}
  }
  return t;
}

// 把 source map 里的 source 路径规整为 zip 内相对路径
function normalizeSourcePath(src, sourceRoot) {
  let s = String(src || "");
  if (sourceRoot && !/^([a-z]+:)?\/\//i.test(s)) s = sourceRoot.replace(/\/?$/, "/") + s;
  // 去掉协议前缀：webpack://name/  webpack-internal:///  file://  http(s)://
  s = s.replace(/^webpack-internal:\/\/\//, "webpack/");
  s = s.replace(/^webpack:\/\//, "webpack/");
  s = s.replace(/^[a-z]+:\/\//i, "");
  s = s.replace(/[?#].*$/, "");
  s = s.replace(/^\.\//, "").replace(/\.\.\//g, "");
  s = s.replace(/^\/+/, "");
  s = s
    .split("/")
    .map((seg) => seg.replace(/[\\:*?"<>|]/g, "_").trim())
    .filter(Boolean)
    .join("/");
  if (!s) s = "unknown";
  return "_sources/" + s;
}

// 解析给定 JS/CSS 资源的 source map，返回还原出的原始源文件列表
async function extractSourcesFromMap(tabId, resUrl) {
  const text = await fetchTextInPage(tabId, resUrl);
  if (!text) return [];
  const mapRef = findSourceMapUrl(text, resUrl);
  if (!mapRef) return [];
  const mapText = await fetchMapText(tabId, mapRef);
  if (!mapText) return [];
  let map;
  try {
    map = JSON.parse(mapText);
  } catch {
    return [];
  }
  const sources = map.sources || [];
  const contents = map.sourcesContent || [];
  const root = map.sourceRoot || "";
  const out = [];
  for (let i = 0; i < sources.length; i++) {
    const content = contents[i];
    if (content == null) continue; // 无内嵌内容的源无法还原
    const zipPath = uniqueName(normalizeSourcePath(sources[i], root), out);
    out.push({ zipPath, content });
  }
  return out;
}

function uniqueName(path, arr) {
  const used = new Set(arr.map((x) => x.zipPath));
  if (!used.has(path)) return path;
  const dot = path.lastIndexOf(".");
  const slash = path.lastIndexOf("/");
  const base = dot > slash ? path.slice(0, dot) : path;
  const ext = dot > slash ? path.slice(dot) : "";
  let i = 1;
  let c;
  do {
    c = `${base}(${i})${ext}`;
    i++;
  } while (used.has(c));
  return c;
}

/* ---------- 阶段 1：扫描 ---------- */
async function handleScan() {
  els.scanBtn.disabled = true;
  els.log.textContent = "";
  hideProgress();
  state.resources = [];
  state.renderedHtml = "";

  const tabId = state.activeTab.id;
  const scanTree = els.optTree.checked;
  const scanDom = els.optDom.checked || els.optRendered.checked;
  const mode = document.querySelector('input[name="scanMode"]:checked')?.value || "deep";

  const collected = new Map(); // key = url -> {url, type, frameId?, requestId?, source}
  const addColl = (url, obj) => {
    if (!/^https?:/i.test(url)) return;
    const prev = collected.get(url) || {};
    collected.set(url, { url, ...prev, ...obj });
  };

  try {
    if (scanTree && chrome.debugger) {
      try {
        if (!state.dbgAttached) {
          log("› 连接调试器…");
          await attach(tabId);
          state.dbgAttached = true;
        }
        await sendCommand(tabId, "Page.enable");
        await sendCommand(tabId, "Network.enable", {
          maxTotalBufferSize: 200000000,
          maxResourceBufferSize: 100000000,
        });
        resetNet();

        if (mode === "deep") {
          log("› 深度模式：刷新页面并监听网络，等待 load + 网络空闲…");
          await sendCommand(tabId, "Page.reload", { ignoreCache: false });
          await waitForLoadAndIdle({ requireLoad: true, quietMs: 1500, maxWaitMs: 30000 });
        } else {
          log("› 快速模式：监听后续网络请求，等待网络空闲…");
          await waitForLoadAndIdle({ requireLoad: false, quietMs: 1200, maxWaitMs: 9000 });
        }

        // 1) 网络事件捕获（完整覆盖异步 / 动态加载资源，与 DevTools 一致）
        let netCount = 0;
        for (const [reqId, info] of net.byReqId) {
          if (!info.url || !/^https?:/i.test(info.url)) continue;
          addColl(info.url, { requestId: reqId, frameId: info.frameId, type: info.type, source: "net" });
          netCount++;
        }
        log(`✓ 网络监听捕获 ${netCount} 项资源`, "ok");

        // 2) 资源树（补齐静态声明资源，并附加 frameId 便于取内容）
        const { frameTree } = await sendCommand(tabId, "Page.getResourceTree");
        const list = [];
        walkFrameTree(frameTree, list);
        for (const r of list) {
          const existed = collected.get(r.url);
          addColl(r.url, { frameId: r.frameId, type: r.type, source: existed ? existed.source : "tree" });
        }
        log(`✓ 资源树共 ${list.length} 项`, "ok");
      } catch (e) {
        log("⚠ 调试器读取失败：" + e.message + "（继续 DOM 扫描）", "warn");
      }
    }

    if (scanDom) {
      log("› 解析页面 DOM…");
      const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: collectFromDom,
      });
      const merged = new Set();
      let mainHtml = "";
      for (const inj of results || []) {
        const data = inj?.result;
        if (!data) continue;
        if (!mainHtml && data.html) mainHtml = data.html;
        for (const a of data.assets) merged.add(a);
      }
      if (els.optRendered.checked && mainHtml) state.renderedHtml = mainHtml;

      if (els.optDom.checked) {
        let added = 0;
        for (const a of merged) {
          if (!collected.has(a)) {
            collected.set(a, { url: a, type: "", source: "dom" });
            added++;
          }
        }
        log(`✓ DOM 发现 ${merged.size} 个引用（新增 ${added}）`, "ok");
      }
    }

    // 转成 UI 资源模型
    let id = 0;
    for (const r of collected.values()) {
      let host = "";
      let pathname = "";
      try {
        const u = new URL(r.url);
        host = u.hostname;
        pathname = decodeURIComponent(u.pathname) + (u.search || "");
      } catch {
        host = "unknown";
        pathname = r.url;
      }
      state.resources.push({
        id: id++,
        url: r.url,
        host,
        pathname,
        type: guessType(r.url, r.type),
        source: r.source,
        frameId: r.frameId || null,
        requestId: r.requestId || null,
        selected: true,
      });
    }

    if (state.resources.length === 0) {
      log("✗ 未发现任何资源，请刷新页面后重试", "err");
      els.scanBtn.disabled = false;
      return;
    }

    // Source Map 还原：把 JS/CSS 的原始源码（app/、src/、webpack/…）加入清单
    if (els.optSourceMap?.checked) {
      const codeRes = state.resources.filter((r) => r.type === "js" || r.type === "css");
      log(`› 解析 ${codeRes.length} 个脚本/样式的 Source Map…`);
      let mapCount = 0;
      const seenZip = new Set();
      let done = 0;
      for (const r of codeRes) {
        setProgress(done, codeRes.length);
        try {
          const srcs = await extractSourcesFromMap(tabId, r.url);
          for (const s of srcs) {
            if (seenZip.has(s.zipPath)) continue;
            seenZip.add(s.zipPath);
            state.resources.push({
              id: id++,
              url: s.zipPath,
              host: "(源码映射)",
              pathname: s.zipPath,
              type: guessType(s.zipPath, ""),
              source: "map",
              frameId: null,
              selected: true,
              content: s.content,
              zipPath: s.zipPath,
            });
            mapCount++;
          }
        } catch {}
        done++;
        setProgress(done, codeRes.length);
      }
      hideProgress();
      log(mapCount ? `✓ Source Map 还原 ${mapCount} 个原始源文件` : "· 未发现可还原的 Source Map", mapCount ? "ok" : "warn");
    }

    log(`✓ 扫描完成，共 ${state.resources.length} 项，请勾选后打包`, "ok");
    hideProgress();
    initFilters();
    switchToListStage();
  } catch (e) {
    log("✗ 扫描失败：" + e.message, "err");
    els.scanBtn.disabled = false;
    if (state.dbgAttached) {
      await detach(tabId);
      state.dbgAttached = false;
    }
  }
}

function switchToListStage() {
  els.stageScan.hidden = true;
  els.stageList.hidden = false;
}

function switchToScanStage() {
  els.stageScan.hidden = false;
  els.stageList.hidden = true;
  els.scanBtn.disabled = false;
}

async function handleRescan() {
  switchToScanStage();
  if (state.dbgAttached && state.activeTab) {
    await detach(state.activeTab.id);
    state.dbgAttached = false;
  }
  resetNet();
  state.resources = [];
  state.renderedHtml = "";
  els.resList.innerHTML = "";
  els.log.textContent = "";
  hideProgress();
}

/* ---------- 阶段 2：筛选 + 列表渲染 ---------- */
function initFilters() {
  state.typeFilter = new Set(TYPE_ORDER);
  state.hostFilter = new Set(getHosts());
  renderChips();
  renderList();
}

function getHosts() {
  const set = new Set();
  for (const r of state.resources) set.add(r.host);
  return [...set];
}

function typeCounts() {
  const m = {};
  for (const t of TYPE_ORDER) m[t] = 0;
  for (const r of state.resources) m[r.type] = (m[r.type] || 0) + 1;
  return m;
}

function hostCounts() {
  const m = {};
  for (const r of state.resources) m[r.host] = (m[r.host] || 0) + 1;
  return m;
}

function renderChips() {
  const tc = typeCounts();
  els.typeChips.innerHTML = "";
  for (const t of TYPE_ORDER) {
    if (!tc[t]) continue;
    const chip = document.createElement("button");
    chip.className = "chip" + (state.typeFilter.has(t) ? " on" : "");
    chip.dataset.testid = `popup-type-${t}`;
    chip.innerHTML = `<span>${TYPE_LABEL[t]}</span><span class="cnt">${tc[t]}</span>`;
    chip.addEventListener("click", () => {
      if (state.typeFilter.has(t)) state.typeFilter.delete(t);
      else state.typeFilter.add(t);
      renderChips();
      renderList();
    });
    els.typeChips.appendChild(chip);
  }

  const hc = hostCounts();
  const hosts = Object.keys(hc).sort((a, b) => {
    if (a === state.primaryHost) return -1;
    if (b === state.primaryHost) return 1;
    return hc[b] - hc[a];
  });
  els.hostChips.innerHTML = "";
  for (const h of hosts) {
    const chip = document.createElement("button");
    chip.className = "chip" + (state.hostFilter.has(h) ? " on" : "");
    chip.title = h;
    const label = h === state.primaryHost ? `${h} · 主` : h;
    chip.innerHTML = `<span>${escapeHtml(label)}</span><span class="cnt">${hc[h]}</span>`;
    chip.addEventListener("click", () => {
      if (state.hostFilter.has(h)) state.hostFilter.delete(h);
      else state.hostFilter.add(h);
      renderChips();
      renderList();
    });
    els.hostChips.appendChild(chip);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function getFilteredResources() {
  const kw = els.searchInput.value.trim().toLowerCase();
  return state.resources.filter((r) => {
    if (!state.typeFilter.has(r.type)) return false;
    if (!state.hostFilter.has(r.host)) return false;
    if (kw && !r.url.toLowerCase().includes(kw)) return false;
    return true;
  });
}

function renderList() {
  const list = getFilteredResources();
  els.resList.innerHTML = "";

  const groups = new Map();
  for (const r of list) {
    if (!groups.has(r.host)) groups.set(r.host, []);
    groups.get(r.host).push(r);
  }
  const hosts = [...groups.keys()].sort((a, b) => {
    if (a === state.primaryHost) return -1;
    if (b === state.primaryHost) return 1;
    return a.localeCompare(b);
  });

  for (const h of hosts) {
    const rows = groups.get(h);
    const head = document.createElement("div");
    head.className = "group-head" + (h === state.primaryHost ? " primary" : "");
    const selInGroup = rows.filter((r) => r.selected).length;
    head.innerHTML = `
      <span class="group-host">${escapeHtml(h)}${h === state.primaryHost ? " · 主域名" : ""}</span>
      <span class="group-cnt">${selInGroup}/${rows.length}</span>
      <button class="group-toggle" data-testid="popup-group-toggle-${escapeHtml(h)}">切换</button>
    `;
    head.querySelector(".group-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      const allOn = rows.every((r) => r.selected);
      rows.forEach((r) => (r.selected = !allOn));
      renderList();
    });
    els.resList.appendChild(head);

    for (const r of rows) {
      const row = document.createElement("label");
      row.className = "row" + (r.selected ? " selected" : "");
      row.dataset.testid = `popup-row-${r.id}`;
      const shortPath = r.pathname || "/";
      row.innerHTML = `
        <input type="checkbox" ${r.selected ? "checked" : ""} data-testid="popup-row-cb-${r.id}" />
        <span class="badge ${r.type}">${TYPE_LABEL[r.type] || r.type}</span>
        <span class="path" title="${escapeHtml(r.url)}"><span class="fname">${escapeHtml(shortPath)}</span></span>
        <span class="src" title="来源">${{ tree: "树", net: "网络", dom: "DOM", map: "映射" }[r.source] || r.source}</span>
      `;
      const cb = row.querySelector("input");
      cb.addEventListener("change", () => {
        r.selected = cb.checked;
        row.classList.toggle("selected", r.selected);
        updateStats();
        const cntEl = head.querySelector(".group-cnt");
        const s = rows.filter((x) => x.selected).length;
        cntEl.textContent = `${s}/${rows.length}`;
      });
      els.resList.appendChild(row);
    }
  }

  updateStats();
}

function updateStats() {
  const total = state.resources.length;
  const sel = state.resources.filter((r) => r.selected).length;
  els.statTotal.textContent = total;
  els.statSel.textContent = sel;
  els.startBtn.disabled = sel === 0;
  els.runTxt.textContent = sel === 0 ? "请勾选资源" : `打包所选 (${sel}) 并下载`;
}

function handleBulk(kind) {
  const visible = getFilteredResources();
  const visibleIds = new Set(visible.map((r) => r.id));

  if (kind === "all") {
    for (const r of state.resources) if (visibleIds.has(r.id)) r.selected = true;
  } else if (kind === "none") {
    for (const r of state.resources) if (visibleIds.has(r.id)) r.selected = false;
  } else if (kind === "invert") {
    for (const r of state.resources) if (visibleIds.has(r.id)) r.selected = !r.selected;
  } else if (kind === "primary") {
    for (const r of state.resources) r.selected = r.host === state.primaryHost;
  }
  renderList();
}

/* ---------- 阶段 3：打包 ---------- */
async function fetchInPage(tabId, url) {
  // 在页面上下文里 fetch，可复用页面的同源 cookie / 凭据，绕过部分 CORS
  try {
    const [inj] = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (u) => {
        try {
          const resp = await fetch(u, { credentials: "include" });
          if (!resp.ok) return { ok: false, status: resp.status };
          const buf = await resp.arrayBuffer();
          let bin = "";
          const bytes = new Uint8Array(buf);
          const CHUNK = 0x8000;
          for (let i = 0; i < bytes.length; i += CHUNK) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
          }
          return { ok: true, b64: btoa(bin) };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      },
      args: [url],
    });
    return inj?.result || { ok: false };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function b64ToUint8(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function handlePack() {
  const picked = state.resources.filter((r) => r.selected);
  if (!picked.length) return;

  els.startBtn.disabled = true;
  els.rescanBtn.disabled = true;
  els.log.textContent = "";
  els.runTxt.textContent = "打包中…";

  const zip = new JSZip();
  const written = new Set();
  const tabId = state.activeTab.id;
  const host = state.primaryHost;
  let ok = 0;
  let fail = 0;
  let done = 0;
  const total = picked.length;

  const addFile = (url, data, opts) => {
    const path = uniquePath(urlToPath(url), written);
    zip.file(path, data, opts);
    written.add(path);
    ok++;
  };
  const addAtPath = (rawPath, data, opts) => {
    const path = uniquePath(rawPath, written);
    zip.file(path, data, opts);
    written.add(path);
    ok++;
  };

  let attached = false;
  try {
    // 复用扫描阶段保持的调试器会话（requestId 才有效）；否则新建连接
    if (chrome.debugger) {
      if (state.dbgAttached) {
        attached = true;
      } else {
        try {
          await attach(tabId);
          state.dbgAttached = true;
          attached = true;
          await sendCommand(tabId, "Page.enable");
        } catch (e) {
          log("⚠ 调试器不可用，改用页面 fetch：" + e.message, "warn");
          attached = false;
        }
      }
    }

    log(`› 开始抓取 ${total} 项资源…`);
    for (const r of picked) {
      setProgress(done, total);
      let saved = false;

      // 0) Source Map 还原的原始源码，内容已在扫描阶段取得
      if (r.source === "map" && typeof r.content === "string") {
        addAtPath(r.zipPath || urlToPath(r.url), r.content);
        saved = true;
        done++;
        setProgress(done, total);
        continue;
      }

      // 1) DevTools 网络响应体（requestId，覆盖异步/动态已加载内容）
      if (attached && r.requestId) {
        try {
          const res = await sendCommand(tabId, "Network.getResponseBody", { requestId: r.requestId });
          if (res && typeof res.body === "string" && res.body.length) {
            if (res.base64Encoded) addFile(r.url, b64ToUint8(res.body));
            else addFile(r.url, res.body);
            saved = true;
          }
        } catch {}
      }

      // 2) DevTools 资源树内容（frameId）
      if (!saved && attached && r.frameId) {
        try {
          const res = await sendCommand(tabId, "Page.getResourceContent", {
            frameId: r.frameId,
            url: r.url,
          });
          if (res && typeof res.content === "string" && res.content.length) {
            if (res.base64Encoded) addFile(r.url, b64ToUint8(res.content));
            else addFile(r.url, res.content);
            saved = true;
          }
        } catch {}
      }

      // 3) 页面上下文 fetch（携带凭据，绕过 CORS）
      if (!saved) {
        const res = await fetchInPage(tabId, r.url);
        if (res.ok && res.b64 != null) {
          addFile(r.url, b64ToUint8(res.b64));
          saved = true;
        }
      }

      // 3) 弹窗直接 fetch（跨域公共资源兜底）
      if (!saved) {
        try {
          const resp = await fetch(r.url);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            addFile(r.url, buf);
            saved = true;
          }
        } catch {}
      }

      if (!saved) {
        fail++;
        log("  ⚠ 跳过 " + r.url, "warn");
      }
      done++;
      setProgress(done, total);
    }

    // 渲染 HTML（若勾选）
    if (state.renderedHtml) {
      const p = uniquePath(`_rendered/${host}.html`, written);
      zip.file(p, state.renderedHtml);
      written.add(p);
      log("✓ 已保存渲染后 HTML", "ok");
    }

    log(`✓ 抓取完成：成功 ${ok} 项，跳过 ${fail} 项`, ok ? "ok" : "warn");

    if (written.size === 0) {
      throw new Error("未成功抓取到任何资源（可能全部跨域受限，请刷新页面后重试）");
    }

    log(`› 生成 ZIP（${written.size} 个文件）…`);
    const blob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
      (meta) => setProgress(Math.round(meta.percent), 100)
    );

    const fname = `sitezip_${host}_${stamp()}.zip`;
    await downloadZip(blob, fname);
    log(`✓ 已开始下载：${fname}`, "ok");
    els.runTxt.textContent = "打包完成 ✓";
  } catch (e) {
    log("✗ 失败：" + e.message, "err");
    els.runTxt.textContent = "重新打包";
  } finally {
    if (attached) {
      await detach(tabId);
      state.dbgAttached = false;
    }
    els.startBtn.disabled = false;
    els.rescanBtn.disabled = false;
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error || new Error("读取失败"));
    fr.readAsDataURL(blob);
  });
}

// 稳健下载：优先数据 URL（自包含，不受弹窗关闭 / blob 回收影响，避免「无法提取文件」），
// 超大文件回退到 blob URL + <a download>。
async function downloadZip(blob, fname) {
  const SIZE_LIMIT = 60 * 1024 * 1024; // 60MB
  if (blob.size <= SIZE_LIMIT) {
    try {
      const dataUrl = await blobToDataURL(blob);
      await chrome.downloads.download({ url: dataUrl, filename: fname, saveAs: false });
      return;
    } catch (e) {
      log("⚠ 数据 URL 下载失败，改用 blob：" + (e?.message || e), "warn");
    }
  }
  const objUrl = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({ url: objUrl, filename: fname, saveAs: false });
  } catch (e) {
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(objUrl), 120000);
  }
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// 注入页面执行：收集渲染 HTML 与引用的静态资源（增强识别）
function collectFromDom() {
  const abs = (u) => {
    try {
      return new URL(u, document.baseURI).href;
    } catch {
      return null;
    }
  };
  const set = new Set();
  const push = (u) => {
    if (!u) return;
    const a = abs(String(u).trim());
    if (a && /^https?:/i.test(a)) set.add(a.split("#")[0]);
  };
  const pushSrcset = (val) => {
    (val || "").split(",").forEach((p) => push(p.trim().split(/\s+/)[0]));
  };
  const pushCssUrls = (text) => {
    if (!text) return;
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
    let m;
    while ((m = re.exec(text))) push(m[2]);
    const imp = /@import\s+(?:url\()?\s*(['"])([^'"]+)\1/g;
    while ((m = imp.exec(text))) push(m[2]);
  };

  // 图片 / 懒加载
  document.querySelectorAll("img").forEach((e) => {
    push(e.getAttribute("src"));
    push(e.getAttribute("data-src"));
    push(e.getAttribute("data-original"));
    pushSrcset(e.getAttribute("srcset"));
    pushSrcset(e.getAttribute("data-srcset"));
  });
  document.querySelectorAll("source").forEach((e) => {
    push(e.getAttribute("src"));
    pushSrcset(e.getAttribute("srcset"));
  });
  // 脚本
  document.querySelectorAll("script[src]").forEach((e) => push(e.getAttribute("src")));
  // link：样式 / 图标 / 预加载 / manifest
  document.querySelectorAll("link[href]").forEach((e) => {
    const rel = (e.getAttribute("rel") || "").toLowerCase();
    if (/stylesheet|icon|preload|manifest|prefetch|apple-touch-icon|mask-icon/.test(rel)) {
      push(e.getAttribute("href"));
    }
  });
  // 媒体
  document.querySelectorAll("video[src], audio[src], track[src], video[poster]").forEach((e) => {
    push(e.getAttribute("src"));
    push(e.getAttribute("poster"));
  });
  // 内联 style 属性
  document.querySelectorAll("[style]").forEach((e) => pushCssUrls(e.getAttribute("style")));
  // <style> 标签内容
  document.querySelectorAll("style").forEach((e) => pushCssUrls(e.textContent));
  // 同源样式表内的 url() / @import
  for (const sheet of document.styleSheets) {
    try {
      if (sheet.href) push(sheet.href);
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of rules) pushCssUrls(rule.cssText);
    } catch {
      // 跨域样式表无法读取 cssRules，忽略
    }
  }

  return { html: "<!doctype html>\n" + document.documentElement.outerHTML, assets: [...set] };
}
