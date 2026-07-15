import { motion } from "framer-motion";
import { Layers, Code2, FolderTree, ShieldCheck, Filter, CheckSquare } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "资源树抓取",
    tag: "核心能力",
    desc: "基于 Chrome DevTools 协议的 Page.getResourceTree，捕获与「源代码/来源」面板完全一致的已加载资源：HTML、CSS、JS、图片、字体、JSON。",
    span: "md:col-span-2",
    big: true,
  },
  {
    icon: Filter,
    title: "按类型过滤",
    tag: "v1.1 新增",
    desc: "HTML / CSS / JS / 图片 / 字体 / JSON / 其他 七类彩色标签，一键筛选，只留想要的类型。",
  },
  {
    icon: CheckSquare,
    title: "勾选下载",
    tag: "v1.1 新增",
    desc: "扫描后展开完整资源清单，按域名分组显示，可勾选 / 反选 / 仅主域名，避免第三方脚本混入。",
  },
  {
    icon: Code2,
    title: "DOM 解析补全",
    desc: "注入脚本解析渲染后的 DOM，补全 img / script / link / source 及内联 url() 引用的资源。",
  },
  {
    icon: FolderTree,
    title: "目录结构还原",
    desc: "按域名与路径还原原始层级，带查询串的资源自动去重命名。",
  },
  {
    icon: ShieldCheck,
    title: "纯本地运行",
    desc: "全程在浏览器内完成抓取与打包，不上传任何数据，隐私安全。",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sz-accent)]">// 功能</div>
          <h2 className="font-display mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            像 DevTools 一样精准，
            <br />
            像点击一样简单
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className={`group border border-[var(--sz-border)]/70 bg-[var(--sz-surface)] p-7 transition-all hover:-translate-y-1 hover:border-[var(--sz-accent)]/50 ${f.span || ""}`}
              data-testid={`feature-card-${i}`}
            >
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center border border-[var(--sz-border)] bg-[var(--sz-bg)] transition-colors group-hover:border-[var(--sz-accent)]/60">
                  <f.icon className="h-5 w-5 text-[var(--sz-accent)]" />
                </div>
                {f.tag && (
                  <span className="border border-[var(--sz-accent)]/40 bg-[var(--sz-accent)]/10 px-2 py-1 font-mono text-[10px] text-[var(--sz-accent)]">
                    {f.tag}
                  </span>
                )}
              </div>
              <h3 className={`font-display mt-5 font-extrabold tracking-tight ${f.big ? "text-2xl" : "text-xl"}`}>
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--sz-muted)]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
