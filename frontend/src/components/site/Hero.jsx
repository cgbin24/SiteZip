import { motion } from "framer-motion";
import { ArrowDown, FolderTree, Zap } from "lucide-react";

const HERO_BG =
  "https://images.unsplash.com/photo-1746470427686-4c3551f3d689?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxjb2RlJTIwbWF0cml4JTIwYWJzdHJhY3R8ZW58MHx8fHwxNzgzNDk0MDY3fDA&ixlib=rb-4.1.0&q=85";

const browsers = ["Chrome", "Edge", "Brave", "Firefox", "Arc", "Opera", "Vivaldi"];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="h-full w-full object-cover opacity-[0.18]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--sz-bg)]/60 via-[var(--sz-bg)]/85 to-[var(--sz-bg)]" />
        <div className="sz-grid-bg absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 border border-[var(--sz-border)] bg-[var(--sz-surface)]/80 px-3 py-1.5 font-mono text-[11px] text-[var(--sz-muted)] backdrop-blur"
            >
              <span className="h-1.5 w-1.5 animate-pulse bg-[var(--sz-accent)]" />
              Manifest V3 · 基于 DevTools 协议
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="font-display mt-6 text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
            >
              把「源代码/来源」
              <br />
              <span className="text-[var(--sz-accent)]">一键打包</span> 成 ZIP
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-[var(--sz-muted)] md:text-lg"
            >
              SiteZip 抓取当前网站在浏览器「源代码 / 来源」面板下加载的全部静态资源，
              保留原始目录结构，一键打包下载到本地。完全本地运行，不上传任何数据。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <a
                href="#install"
                className="group flex items-center gap-2 bg-[var(--sz-accent)] px-6 py-3.5 font-sans text-sm font-extrabold text-[#1a1200] transition-all hover:bg-[var(--sz-accent-hi)] hover:-translate-y-1"
                data-testid="hero-install-btn"
              >
                <Zap className="h-4 w-4" />
                获取扩展
              </a>
              <a
                href="#how"
                className="flex items-center gap-2 border border-[var(--sz-border)] px-6 py-3.5 font-mono text-sm text-[var(--sz-text)] transition-all hover:border-[var(--sz-faint)] hover:-translate-y-1"
                data-testid="hero-how-btn"
              >
                查看抓取原理
                <ArrowDown className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sz-faint)]">支持的浏览器</div>
              <div className="mt-3 flex w-full max-w-md overflow-hidden">
                <div className="sz-marquee flex shrink-0 gap-8 pr-8">
                  {[...browsers, ...browsers].map((b, i) => (
                    <span key={i} className="font-mono text-sm text-[var(--sz-muted2)]">{b}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* 资源树视觉 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="border border-[var(--sz-border)] bg-[var(--sz-bg2)]/90 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-[var(--sz-border)] px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-[#ef4444]/70" />
                <span className="h-3 w-3 rounded-full bg-[var(--sz-accent)]/70" />
                <span className="h-3 w-3 rounded-full bg-[#22c55e]/70" />
                <span className="ml-2 font-mono text-[11px] text-[var(--sz-muted2)]">源代码 / 来源</span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-7">
                <TreeRow indent={0} icon="▸" label="top" muted />
                <TreeRow indent={1} icon="☁" label="example.com" accent />
                <TreeRow indent={2} icon="📁" label="data/poster" />
                <TreeRow indent={2} icon="📁" label="images" />
                <TreeRow indent={2} icon="📁" label="minify" />
                <TreeRow indent={2} icon="📄" label="(索引)" />
                <div className="mt-4 flex items-center gap-2 border-t border-dashed border-[var(--sz-border)] pt-4 text-[var(--sz-accent)]">
                  <FolderTree className="h-4 w-4" />
                  <span className="text-[var(--sz-muted)]">→ 打包为</span>
                  <span className="text-[var(--sz-text)]">example.com.zip</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TreeRow({ indent, icon, label, accent, muted }) {
  return (
    <div
      className={`flex items-center gap-2 ${accent ? "bg-[var(--sz-accent)]/10 -mx-2 px-2" : ""}`}
      style={{ paddingLeft: `${indent * 18}px` }}
    >
      <span className={accent ? "text-[var(--sz-accent)]" : "text-[var(--sz-faint)]"}>{icon}</span>
      <span className={accent ? "text-[var(--sz-accent-hi)]" : muted ? "text-[var(--sz-muted2)]" : "text-[var(--sz-text2)]"}>{label}</span>
    </div>
  );
}
