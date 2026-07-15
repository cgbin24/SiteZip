import { Package } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--sz-border)] bg-[var(--sz-bg2)]" data-testid="footer">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center border border-[var(--sz-border)] bg-[var(--sz-surface)]">
            <Package className="h-4 w-4 text-[var(--sz-accent)]" />
          </div>
          <div>
            <div className="font-display text-base font-extrabold tracking-tight">SiteZip</div>
            <div className="font-mono text-[10px] text-[var(--sz-muted2)]">站点静态资源一键打包</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-[var(--sz-muted)]">
          <a href="#features" className="transition-colors hover:text-[var(--sz-text)]">功能</a>
          <a href="#how" className="transition-colors hover:text-[var(--sz-text)]">原理</a>
          <a href="#install" className="transition-colors hover:text-[var(--sz-text)]">安装</a>
          <span className="text-[var(--sz-border2)]">·</span>
          <span className="text-[var(--sz-faint)]">文档见 /docs</span>
        </div>

        <div className="font-mono text-[11px] text-[var(--sz-faint)]">
          © 2026 SiteZip · 仅供学习与技术交流
        </div>
      </div>
    </footer>
  );
}
