// SiteZip service worker — 保持轻量。核心抓取逻辑位于 popup.js。
chrome.runtime.onInstalled.addListener(() => {
  console.log("[SiteZip] 扩展已安装 / 更新完成");
});

// 若浏览器不支持默认弹窗自动打开的情况下，兜底打开弹窗
chrome.action.onClicked?.addListener?.(() => {
  chrome.action.openPopup?.().catch(() => {});
});
