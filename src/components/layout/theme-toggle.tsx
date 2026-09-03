"use client";

import * as React from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const handleToggle = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative h-9 w-9 rounded-xl hover:bg-muted/60 transition-colors group cursor-pointer text-foreground hover:text-primary"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Alternar tema"
    >
      {/* Inner Moon Animated SVG (toggles.dev) */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 32 32"
        fill="currentColor"
        aria-hidden="true"
        className="overflow-visible transition-colors"
      >
        {/* Outer 8-point sun / star geometry with elastic 180° rotation */}
        <path
          d="M27.5 11.5v-7h-7L16 0l-4.5 4.5h-7v7L0 16l4.5 4.5v7h7L16 32l4.5-4.5h7v-7L32 16l-4.5-4.5zM16 25.4a9.39 9.39 0 1 1 0-18.8 9.39 9.39 0 1 1 0 18.8z"
          className="origin-center transition-transform duration-500 ease-[cubic-bezier(0,0,0.15,1.25)]"
          style={{
            transform: isDark ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />

        {/* Center circle that shifts horizontally to form the crescent inner moon */}
        <circle
          cx={16}
          cy={16}
          r={8.1}
          className="origin-center transition-transform duration-350 ease-in-out"
          style={{
            transform: isDark ? "translateX(4.8px)" : "translateX(0px)",
          }}
        />
      </svg>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
