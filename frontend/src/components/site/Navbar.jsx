import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
          scrolled ? "border-b border-white/10 bg-[var(--sz-nav)] backdrop-blur-xl" : "border-b border-transparent"
        }`}
        data-testid="navbar"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#top" className="flex items-center gap-2.5" data-testid="navbar-brand">
            <div className="grid h-9 w-9 place-items-center border border-[var(--sz-border)] bg-[var(--sz-surface)]">
              <img src="/logo.svg" alt="SiteZip Logo" className="h-6 w-6 text-[var(--sz-accent)]" />
            </div>
            <div className="leading-none">
              <div className="font-display text-lg font-extrabold tracking-tight">SiteZip</div>
              <div className="font-mono text-[10px] text-[var(--sz-muted2)]">静态资源打包器</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 font-mono text-xs text-[var(--sz-muted)] md:flex">
            <a href="#features" className="transition-colors hover:text-[var(--sz-text)]" data-testid="nav-features">功能</a>
            <a href="#how" className="transition-colors hover:text-[var(--sz-text)]" data-testid="nav-how">原理</a>
            <a href="#install" className="transition-colors hover:text-[var(--sz-text)]" data-testid="nav-install">安装</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </motion.header>
    </>
  );
}
