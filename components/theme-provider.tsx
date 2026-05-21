"use client";

import * as React from "react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import {
  ThemePersonality,
  PERSONALITY_STORAGE_KEY,
  defaultThemeConfig,
  themeMetadata,
} from "@/lib/themes";

interface ThemeContextValue {
  personality: ThemePersonality;
  setPersonality: (personality: ThemePersonality) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

export function useThemePersonality() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useThemePersonality must be used within a ThemeProvider"
    );
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [personality, setPersonalityState] = React.useState<ThemePersonality>(
    defaultThemeConfig.personality
  );
  const [mounted, setMounted] = React.useState(false);
  // True once a user-driven or storage-restored value has been
  // installed. The flag-default effect uses this to know whether it's
  // still safe to flip the theme out from under the user.
  const hasUserChoiceRef = React.useRef(false);
  // Phase 8 A/B: when the flag is on, fresh users (no localStorage
  // value) land in Earned instead of Arctic. `undefined` from PostHog
  // means the flag hasn't loaded yet — we wait rather than apply.
  const earnedDefaultFlag = useFeatureFlagEnabled("earned-theme-default");

  // Load personality from localStorage on mount, with migration for old themes
  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(PERSONALITY_STORAGE_KEY);
    const OLD_THEMES = ["warm-bento", "brutalist", "swiss-poster", "analog"];
    if (stored && OLD_THEMES.includes(stored)) {
      // Migrate old theme to new default
      const newDefault = defaultThemeConfig.personality;
      localStorage.setItem(PERSONALITY_STORAGE_KEY, newDefault);
      setPersonalityState(newDefault);
      hasUserChoiceRef.current = true;
    } else if (stored && stored in themeMetadata) {
      setPersonalityState(stored as ThemePersonality);
      hasUserChoiceRef.current = true;
    }
  }, []);

  // Apply Phase 8 flag default for fresh users only. Sticky once
  // applied: we write to localStorage so subsequent visits use the
  // bucketed value even if the flag is later turned off — important
  // for A/B post-hoc analysis.
  const flagAppliedRef = React.useRef(false);
  React.useEffect(() => {
    if (!mounted || flagAppliedRef.current) return;
    if (hasUserChoiceRef.current) return;
    if (earnedDefaultFlag === undefined) return; // flag still loading
    flagAppliedRef.current = true;
    if (earnedDefaultFlag === true) {
      hasUserChoiceRef.current = true;
      setPersonalityState("earned");
      // Persist so the next visit no-ops the flag check.
      localStorage.setItem(PERSONALITY_STORAGE_KEY, "earned");
    }
  }, [mounted, earnedDefaultFlag]);

  // Update data-theme attribute when personality changes
  React.useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", personality);
      // Only persist values the user has effectively committed to — a
      // bare "default arctic" pre-flag-resolution shouldn't lock in
      // before the experiment has a chance to bucket the user.
      if (hasUserChoiceRef.current) {
        localStorage.setItem(PERSONALITY_STORAGE_KEY, personality);
      }
      // Keep the PWA chrome (status bar, browser bar) in sync with the
      // active theme's page background — otherwise iOS standalone mode
      // shows a stale colour from the static <meta> in layout.tsx.
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", themeMetadata[personality].preview.bg);
      }
    }
  }, [personality, mounted]);

  const setPersonality = React.useCallback((newPersonality: ThemePersonality) => {
    hasUserChoiceRef.current = true;
    setPersonalityState(newPersonality);
  }, []);

  const contextValue = React.useMemo(
    () => ({ personality, setPersonality }),
    [personality, setPersonality]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
