"use client";

import * as React from "react";
import posthog from "posthog-js";
import {
  ThemePersonality,
  PERSONALITY_STORAGE_KEY,
  defaultThemeConfig,
  resolveStoredPersonality,
} from "@/lib/themes";

interface ThemeContextValue {
  personality: ThemePersonality;
  /**
   * @param opts.silent - suppress the `theme_switched` analytics event for
   *   programmatic changes (e.g. restoring a saved theme on mount), which are
   *   not user-initiated switches.
   */
  setPersonality: (
    personality: ThemePersonality,
    opts?: { silent?: boolean },
  ) => void;
  /** True once the stored theme has been read from localStorage. Consumers that
   *  report the active theme (analytics) should wait for this so they capture
   *  the resolved value, not the pre-hydration default. */
  hydrated: boolean;
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

  // Load personality from localStorage on mount. resolveStoredPersonality
  // applies removed-theme migration and the one-time legacy-default ("arctic")
  // reset, writing back any change so the stored value stays canonical.
  React.useEffect(() => {
    setMounted(true);
    setPersonalityState(resolveStoredPersonality());
  }, []);

  // Update data-theme attribute when personality changes
  React.useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", personality);
      localStorage.setItem(PERSONALITY_STORAGE_KEY, personality);
      // Keep the browser/PWA chrome (status bar) matching the active theme's
      // paper color so the page reads full-screen instead of a contrasting bar.
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      if (bg) {
        let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "theme-color";
          document.head.appendChild(meta);
        }
        meta.content = bg;
      }
    }
  }, [personality, mounted]);

  const setPersonality = React.useCallback(
    (newPersonality: ThemePersonality, opts?: { silent?: boolean }) => {
      // Fire outside the state updater so React StrictMode's double-invoke of
      // updater functions can't double-count the switch. `silent` skips the
      // event for programmatic restores (not real user switches).
      if (!opts?.silent && newPersonality !== personality) {
        posthog.capture("theme_switched", {
          from: personality,
          to: newPersonality,
        });
      }
      setPersonalityState(newPersonality);
    },
    [personality],
  );

  const contextValue = React.useMemo(
    () => ({ personality, setPersonality, hydrated: mounted }),
    [personality, setPersonality, mounted]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
