import { Package, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--sz-border)] bg-[var(--sz-bg2)]" data-testid="footer">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center border border-[var(--sz-border)] bg-[var(--sz-surface)]">
            <img src="/logo.svg" alt="SiteZip Logo" className="h-6 w-6 text-[var(--sz-accent)]" />
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
          <a
            href="https://github.com/cgbin24/SiteZip"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub · cgbin24"
            className="group bg-[var(--r-surface)] text-[var(--r-text-muted)] shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:text-[var(--r-accent)] transition-colors duration-300 flex items-center justify-center relative"
          >
            <span className="absolute bottom-full mb-4 bg-[var(--r-surface)] border border-[var(--r-border)] text-[var(--r-text)] text-xs py-1.5 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono-jb">
              GitHub · cgbin24
            </span>
            <Github className="w-5 h-5" />
          </a>
        </div>

        <div className="font-mono text-[11px] text-[var(--sz-faint)]">
          © 2026 SiteZip · 仅供学习与技术交流
        </div>
      </div>
    </footer>
  );
}
