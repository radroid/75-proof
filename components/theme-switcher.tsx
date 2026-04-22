"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePersonality } from "@/components/theme-provider";
import {
  themeMetadata,
  themeOrder,
  type ThemePersonality,
} from "@/lib/themes";

interface ThemeSwitcherProps {
  className?: string;
}

// Theme-specific visual signatures for mini previews.
// Keeps previews scoped/inline — does NOT touch global theme CSS vars or
// the real dashboard components.
const themeSignatures: Record<
  ThemePersonality,
  {
    fontFamily?: string;
    badgeRadius: string; // tailwind class for badge rounding
    badgeFontClass: string;
    badgeLabel: string;
    chipRadius: string;
    /** Render subtle background flourish (grid, rule, etc.) */
    flourish?: React.ReactNode;
  }
> = {
  arctic: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    badgeRadius: "rounded-lg",
    badgeFontClass: "font-semibold tracking-tight",
    badgeLabel: "12",
    chipRadius: "rounded-sm",
  },
  broadsheet: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    badgeRadius: "rounded-none",
    badgeFontClass: "font-bold italic",
    badgeLabel: "XII",
    chipRadius: "rounded-none",
    flourish: (
      // Horizontal rule evoking a newspaper masthead
      <div
        aria-hidden
        className="absolute inset-x-3 top-[42%] h-px"
        style={{ backgroundColor: "currentColor", opacity: 0.2 }}
      />
    ),
  },
  military: {
    fontFamily:
      "'Courier New', ui-monospace, SFMono-Regular, Menlo, monospace",
    badgeRadius: "rounded-none",
    badgeFontClass: "font-bold tracking-widest uppercase",
    badgeLabel: "12",
    chipRadius: "rounded-none",
    flourish: (
      // Faint grid overlay evoking tactical HUD
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "8px 8px",
          color: "currentColor",
        }}
      />
    ),
  },
  zen: {
    fontFamily: "'Hiragino Mincho ProN', 'Georgia', serif",
    badgeRadius: "rounded-full",
    badgeFontClass: "font-medium tracking-tight",
    badgeLabel: "12",
    chipRadius: "rounded-full",
  },
};

export function ThemePreviewArt({ personality }: { personality: ThemePersonality }) {
  const meta = themeMetadata[personality];
  const sig = themeSignatures[personality];

  return (
    <div
      className="relative h-24 sm:h-28 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden"
      style={{
        backgroundColor: meta.preview.bg,
        color: meta.preview.fg,
        fontFamily: sig.fontFamily,
      }}
    >
      {sig.flourish}

      {/* Row 1: day badge + two pseudo-text lines */}
      <div className="relative flex items-center gap-2">
        <div
          className={cn(
            "w-8 h-8 flex items-center justify-center text-[11px] leading-none shrink-0",
            sig.badgeRadius,
            sig.badgeFontClass
          )}
          style={{
            backgroundColor: meta.preview.accent,
            color: meta.preview.bg,
          }}
        >
          {sig.badgeLabel}
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <div
            className="h-1.5 rounded-full w-3/4"
            style={{ backgroundColor: meta.preview.accent, opacity: 0.3 }}
          />
          <div
            className="h-1 rounded-full w-1/2"
            style={{ backgroundColor: meta.preview.fg, opacity: 0.15 }}
          />
        </div>
      </div>

      {/* Row 2: habit progress chips (2 filled, 1 empty) */}
      <div className="relative flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-2 flex-1", sig.chipRadius)}
            style={{
              backgroundColor:
                i <= 2 ? meta.preview.accent : meta.preview.fg,
              opacity: i <= 2 ? 0.7 : 0.12,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { personality, setPersonality } = useThemePersonality();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn("animate-pulse bg-muted rounded-xl h-48", className)}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="radiogroup"
        aria-label="Theme style"
        className="grid grid-cols-2 gap-3"
      >
        {themeOrder.map((key) => {
          const meta = themeMetadata[key];
          const isSelected = personality === key;

          return (
            <motion.button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${meta.name}. ${meta.description}`}
              onClick={() => setPersonality(key)}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-xl border-2 text-left",
                "min-h-[44px] transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:shadow-sm"
              )}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              {/* Visual preview — true-to-theme mini mockup */}
              <ThemePreviewArt personality={key} />

              {/* Label */}
              <div className="px-3 py-2.5 bg-card">
                <p className="font-semibold text-sm leading-tight text-foreground">
                  {meta.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {meta.description}
                </p>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm"
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
