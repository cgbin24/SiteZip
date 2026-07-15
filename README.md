# SiteZip 浏览器扩展

抓取当前网站「源代码 / 来源」面板下的静态资源，按类型 / 域名筛选、勾选后打包为 ZIP。

## 安装（Chrome / Edge）
1. 打开 `chrome://extensions`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择本目录

## 安装（Firefox）
1. 打开 `about:debugging#/runtime/this-firefox`
2. **临时载入附加组件** → 选择本目录下 `manifest.json`
3. Firefox 自动使用 DOM+fetch 降级模式

## 使用（两步式）
1. 点击 SiteZip 图标 → 勾选抓取选项 → **扫描资源列表**
2. 在列表中按类型（HTML/CSS/JS/图片/字体/JSON/其他）与域名过滤，勾选想要的资源
3. 点击 **打包所选并下载 ZIP**

## 文件
- `manifest.json` — MV3 清单
- `popup.html/css/js` — 弹窗 UI 与核心抓取逻辑
- `background.js` — 轻量 service worker
- `lib/jszip.min.js` — 本地打包库
- `icons/` — 图标


⚠️本项目仅供**学习、研究、个人备份及技术交流**等合法用途使用。

详细文档见项目 `/docs` 目录。
