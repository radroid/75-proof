"use client";

import * as React from "react";
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
    } else if (stored && stored in themeMetadata) {
      setPersonalityState(stored as ThemePersonality);
    }
  }, []);

  // Update data-theme attribute when personality changes
  React.useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", personality);
      localStorage.setItem(PERSONALITY_STORAGE_KEY, personality);
    }
  }, [personality, mounted]);

  const setPersonality = React.useCallback((newPersonality: ThemePersonality) => {
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
