// Theme types — 4 visual themes
export type ThemePersonality = "arctic" | "broadsheet" | "military" | "zen";

export interface ThemeConfig {
  personality: ThemePersonality;
}

export interface ThemeMetadata {
  name: string;
  description: string;
  preview: {
    bg: string;
    fg: string;
    accent: string;
    card: string;
  };
}

export const themeMetadata: Record<ThemePersonality, ThemeMetadata> = {
  arctic: {
    name: "Arctic",
    description: "Minimal white, electric blue accents, clean and modern",
    preview: {
      bg: "#ffffff",
      fg: "#111111",
      accent: "#2563eb",
      card: "#f8fafc",
    },
  },
  broadsheet: {
    name: "Broadsheet",
    description: "Newspaper journal, serif typography, cream newsprint",
    preview: {
      bg: "#f5f0e8",
      fg: "#1a1410",
      accent: "#9e2a2b",
      card: "#f5f0e8",
    },
  },
  military: {
    name: "Military Ops",
    description: "Tactical dark, olive and khaki, stencil type, grid overlay",
    preview: {
      bg: "#1a1f14",
      fg: "#c2b280",
      accent: "#4ade80",
      card: "#1e2518",
    },
  },
  zen: {
    name: "Zen Garden",
    description: "Japanese minimalism, warm stone, moss and clay, organic",
    preview: {
      bg: "#f7f3ee",
      fg: "#2b2622",
      accent: "#6b7c5e",
      card: "#f7f3ee",
    },
  },
};

export const themeOrder: ThemePersonality[] = [
  "arctic",
  "broadsheet",
  "military",
  "zen",
];

// Old theme names for migration
const OLD_THEME_NAMES = ["warm-bento", "brutalist", "swiss-poster", "analog"];

// Local storage keys
export const PERSONALITY_STORAGE_KEY = "75hard-personality";

// Default theme configuration
export const defaultThemeConfig: ThemeConfig = {
  personality: "arctic",
};

export function getStoredPersonality(): ThemePersonality {
  if (typeof window === "undefined") return defaultThemeConfig.personality;
  const stored = localStorage.getItem(PERSONALITY_STORAGE_KEY);
  // Migrate old theme names to default
  if (stored && OLD_THEME_NAMES.includes(stored)) {
    localStorage.setItem(PERSONALITY_STORAGE_KEY, defaultThemeConfig.personality);
    return defaultThemeConfig.personality;
  }
  if (stored && stored in themeMetadata) return stored as ThemePersonality;
  return defaultThemeConfig.personality;
}

export function setStoredPersonality(personality: ThemePersonality): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERSONALITY_STORAGE_KEY, personality);
}
