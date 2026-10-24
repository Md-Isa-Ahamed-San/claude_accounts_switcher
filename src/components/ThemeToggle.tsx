"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="flex h-7 w-[96px] items-center border border-border bg-surface px-1">
        <div className="h-4 w-6 bg-transparent" />
        <div className="h-4 w-6 bg-transparent" />
        <div className="h-4 w-6 bg-transparent" />
      </div>
    );
  }

  const options = [
    { value: "light", label: "Light theme", id: "theme-btn-light", icon: Sun },
    { value: "system", label: "System theme", id: "theme-btn-system", icon: Monitor },
    { value: "dark", label: "Dark theme", id: "theme-btn-dark", icon: Moon },
  ] as const;

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className="inline-flex h-7 items-center border border-border bg-surface"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            id={opt.id}
            type="button"
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            className={`relative flex h-full w-8 items-center justify-center transition-colors border-r last:border-r-0 border-border cursor-pointer ${
              isActive
                ? "bg-foreground text-ground font-medium"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <Icon className="h-3 w-3" />
          </button>
        );
      })}
    </div>
  );
}
