import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, Chrome, Puzzle, ToggleRight, FolderOpen } from "lucide-react";

const EXT_FILE = "./sitezip-extension.zip";

const installSteps = [
  { icon: FolderOpen, text: "解压下载的 sitezip-extension.zip 到本地目录" },
  { icon: Chrome, text: "地址栏打开 chrome://extensions（Edge 为 edge://extensions）" },
  { icon: ToggleRight, text: "打开右上角「开发者模式」" },
  { icon: Puzzle, text: "点击「加载已解压的扩展程序」并选择解压目录" },
];

export default function Install() {

  const downloadExt = () => {
    const a = document.createElement("a");
    a.href = EXT_FILE;
    a.download = "sitezip-extension.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("扩展开始下载", { description: "解压后按右侧步骤加载即可" });
  };

  return (
    <section id="install" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="border border-[var(--sz-border)] bg-gradient-to-br from-[var(--sz-surface)] to-[var(--sz-bg2)] p-9 md:p-12"
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sz-accent)]">// 安装</div>
            <h2 className="font-display mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              30 秒
              <br />
              装好开用
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[var(--sz-muted)]">
              开发者模式加载，无需应用商店。支持 Chrome、Edge 及主流 Chromium 浏览器。
            </p>
            <button
              onClick={downloadExt}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-[var(--sz-accent)] py-4 font-sans text-base font-extrabold text-[#1a1200] transition-all hover:bg-[var(--sz-accent-hi)] hover:-translate-y-1 sm:w-auto sm:px-10"
              data-testid="download-extension-btn"
            >
              <Download className="h-5 w-5" />
              下载扩展 (ZIP)
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="space-y-3"
          >
            {installSteps.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border border-[var(--sz-border)]/70 bg-[var(--sz-surface)] p-5 transition-colors hover:border-[var(--sz-faint)]"
                data-testid={`install-step-${i}`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-[var(--sz-border)] bg-[var(--sz-bg)]">
                  <s.icon className="h-5 w-5 text-[var(--sz-accent)]" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-[var(--sz-faint)]">0{i + 1}</span>
                  <span className="text-sm text-[var(--sz-text2)]">{s.text}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
