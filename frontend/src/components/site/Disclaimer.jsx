import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";

const points = [
  "本项目仅供学习、研究、个人备份及技术交流等合法用途使用。",
  "其技术能力等同于浏览器开发者工具，仅抓取浏览器已正常加载的公开资源。",
  "使用者应遵守目标网站的服务条款、robots 协议，尊重著作权等知识产权。",
  "是否有权抓取及如何使用特定资源，由使用者自行判断并承担全部责任。",
  "本项目按「现状」提供，作者不对因使用产生的任何损失承担责任。",
];

export default function Disclaimer() {
  return (
    <section className="relative border-t border-[var(--sz-border)]/60 py-20">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="border border-[var(--sz-accent)]/30 bg-[var(--sz-accent)]/[0.04] p-8 md:p-10"
          data-testid="disclaimer"
        >
          <div className="flex items-center gap-3">
            <TriangleAlert className="h-5 w-5 text-[var(--sz-accent)]" />
            <h2 className="font-display text-2xl font-extrabold tracking-tight">免责声明</h2>
          </div>
          <ul className="mt-6 space-y-3">
            {points.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--sz-muted)]">
                <span className="mt-1 font-mono text-xs text-[var(--sz-accent)]">{String(i + 1).padStart(2, "0")}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-[var(--sz-border)] pt-5 font-mono text-xs text-[var(--sz-muted2)]">
            如果您不同意本免责声明的任何内容，请立即停止使用本项目。完整条款见 /docs/免责声明.md
          </p>
        </motion.div>
      </div>
    </section>
  );
}
