"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { themeMetadata, themeOrder, type ThemePersonality } from "@/lib/themes";
import { useThemePersonality } from "@/components/theme-provider";
import type { OnboardingState } from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingTheme({ state, updateState, onNext, onBack }: Props) {
  const { setPersonality } = useThemePersonality();

  const handleSelectTheme = (key: ThemePersonality) => {
    updateState({ theme: key });
    // Apply theme immediately so the entire page reflects the selection
    setPersonality(key);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Choose your theme
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Pick a visual style for your dashboard. You can change this anytime.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {themeOrder.map((key) => {
          const theme = themeMetadata[key];
          const selected = state.theme === key;
          return (
            <button
              key={key}
              onClick={() => handleSelectTheme(key)}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden text-left transition-all",
                "hover:shadow-md",
                selected
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              )}
            >
              {/* Theme preview */}
              <div
                className="h-24 sm:h-28 p-3 sm:p-4 flex flex-col justify-between"
                style={{ backgroundColor: theme.preview.bg }}
              >
                {/* Mini dashboard mockup */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-md font-bold text-xs flex items-center justify-center"
                    style={{
                      backgroundColor: theme.preview.accent,
                      color: theme.preview.bg,
                    }}
                  >
                    12
                  </div>
                  <div className="space-y-1 flex-1">
                    <div
                      className="h-1.5 rounded-full w-3/4"
                      style={{ backgroundColor: theme.preview.accent, opacity: 0.3 }}
                    />
                    <div
                      className="h-1 rounded-full w-1/2"
                      style={{ backgroundColor: theme.preview.fg, opacity: 0.15 }}
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-sm"
                      style={{
                        backgroundColor: i <= 2 ? theme.preview.accent : theme.preview.fg,
                        opacity: i <= 2 ? 0.6 : 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Label */}
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-card">
                <p className="font-semibold text-sm">{theme.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {theme.description}
                </p>
              </div>

              {/* Selection indicator */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} size="lg" className="gap-2">
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
