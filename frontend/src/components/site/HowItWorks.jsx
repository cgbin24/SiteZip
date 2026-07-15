import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "打开目标网页",
    desc: "在任意 http/https 页面浏览、滚动，让静态资源加载进「源代码/来源」面板。",
  },
  {
    n: "02",
    title: "点击 SiteZip 图标",
    desc: "弹窗展示当前站点与三个抓取选项：资源树抓取、DOM 补全、渲染 HTML。",
  },
  {
    n: "03",
    title: "扫描并筛选资源",
    desc: "点击「扫描资源列表」，按类型（HTML/CSS/JS/图片/字体等）与域名分组浏览，勾选想要的资源。",
  },
  {
    n: "04",
    title: "打包所选并下载 ZIP",
    desc: "JSZip 按原目录结构压缩，自动下载 sitezip_<域名>_<时间戳>.zip。",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative border-y border-[var(--sz-border)]/60 bg-[var(--sz-bg2)] py-24 md:py-32">
      <div className="sz-grid-bg absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sz-accent)]">// 原理</div>
            <h2 className="font-display mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              四步，
              <br />
              从网页到本地
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[var(--sz-muted)]">
              SiteZip 的抓取能力等同于浏览器开发者工具本身——只是把繁琐的手动操作，
              压缩成了扫描 + 勾选 + 一次点击。
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-px overflow-hidden border border-[var(--sz-border)] bg-[var(--sz-border)] sm:grid-cols-2">
              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group bg-[var(--sz-surface)] p-8 transition-colors hover:bg-[var(--sz-surface2)]"
                  data-testid={`step-${i}`}
                >
                  <div className="font-display text-5xl font-black text-[var(--sz-border)] transition-colors group-hover:text-[var(--sz-accent)]/70">
                    {s.n}
                  </div>
                  <h3 className="font-display mt-4 text-xl font-extrabold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sz-muted)]">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
