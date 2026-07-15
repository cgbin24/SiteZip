import { useEffect, useState } from "react";
import { Sun, Moon, Leaf } from "lucide-react";

const THEMES = [
  { id: "dark", label: "深色", icon: Moon },
  { id: "light", label: "浅色", icon: Sun },
  { id: "green", label: "护眼", icon: Leaf },
];

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem("sz_theme");
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {}
  return "dark";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("sz_theme", theme);
  } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-[var(--sz-border)] bg-[var(--sz-surface)] p-1"
      data-testid="theme-toggle"
    >
      {THEMES.map((t) => {
        const Icon = t.icon;
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            aria-label={t.label}
            data-testid={`theme-${t.id}`}
            className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
              active
                ? "bg-[var(--sz-accent)] text-[#1a1200]"
                : "text-[var(--sz-muted)] hover:text-[var(--sz-text)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
