"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useThemePersonality } from "@/components/theme-provider";
import {
  themeMetadata,
  themeOrder,
} from "@/lib/themes";

interface ThemeSwitcherProps {
  className?: string;
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
        className={cn(
          "animate-pulse bg-muted rounded-xl h-48",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-foreground">
        Theme Style
      </label>
      <div className="grid grid-cols-2 gap-3">
        {themeOrder.map((key) => {
          const meta = themeMetadata[key];
          const isSelected = personality === key;

          return (
            <motion.button
              key={key}
              onClick={() => setPersonality(key)}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Color preview swatches */}
              <div className="flex gap-1.5">
                <div
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: meta.preview.bg }}
                />
                <div
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: meta.preview.fg }}
                />
                <div
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: meta.preview.accent }}
                />
                <div
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: meta.preview.card }}
                />
              </div>
              <div>
                <p className="font-semibold text-foreground">{meta.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {meta.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
