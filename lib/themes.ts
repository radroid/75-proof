// =============================================================================
// THEME REGISTRY — single source of truth
// =============================================================================
// To ADD A NEW THEME you touch as few places as possible:
//
//   1. Add ONE object to THEME_DEFINITIONS below (this gives you the union type,
//      the metadata, the switcher order, AND — if it's first — the default).
//   2. Add a matching `[data-theme="<key>"]` block to app/globals.css mapping the
//      same CSS variables the other themes define (Tailwind needs static CSS, so
//      this block is the one unavoidable duplicate — copy an existing theme block
//      as a template).
//
// Optional (each has a sensible fallback so the theme works without them):
//   3. A preview "signature" in components/theme-switcher.tsx (else a default
//      preview is rendered).
//   4. A themed dashboard in components/themes/<key>-dashboard.tsx, registered in
//      app/(dashboard)/dashboard/page.tsx (else the token-driven EarnedDashboard
//      is used — it already adapts to any theme's tokens).
//
// The FIRST entry in THEME_DEFINITIONS is the app-wide default theme.
// See docs/theming.md for the full walkthrough.
// =============================================================================

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

interface ThemeDefinition extends ThemeMetadata {
  /** Stable key — must match the `[data-theme="<key>"]` selector in globals.css. */
  key: string;
}

// Ordered list — index 0 is the default theme, and this is also the order
// themes appear in the switcher / onboarding picker.
const THEME_DEFINITIONS = [
  {
    key: "earned",
    name: "Earned",
    description: "Cream paper notebook, ink and sky, a gold star for showing up",
    preview: {
      bg: "#f4ecd8",
      fg: "#1f1f1d",
      accent: "#0085d4",
      card: "#f9f3e1",
    },
  },
  {
    key: "arctic",
    name: "Arctic",
    description: "Minimal white, electric blue accents, clean and modern",
    preview: {
      bg: "#ffffff",
      fg: "#111111",
      accent: "#2563eb",
      card: "#f8fafc",
    },
  },
  {
    key: "broadsheet",
    name: "Broadsheet",
    description: "Newspaper journal, serif typography, cream newsprint",
    preview: {
      bg: "#f5f0e8",
      fg: "#1a1410",
      accent: "#9e2a2b",
      card: "#f5f0e8",
    },
  },
  {
    key: "military",
    name: "Military Ops",
    description: "Tactical dark, olive and khaki, stencil type, grid overlay",
    preview: {
      bg: "#1a1f14",
      fg: "#c2b280",
      accent: "#4ade80",
      card: "#1e2518",
    },
  },
  {
    key: "zen",
    name: "Zen Garden",
    description: "Japanese minimalism, warm stone, moss and clay, organic",
    preview: {
      bg: "#f7f3ee",
      fg: "#2b2622",
      accent: "#6b7c5e",
      card: "#f7f3ee",
    },
  },
] as const satisfies readonly ThemeDefinition[];

// Theme keys — union type derived from the registry (no manual maintenance).
export type ThemePersonality = (typeof THEME_DEFINITIONS)[number]["key"];

export interface ThemeConfig {
  personality: ThemePersonality;
}

// Metadata map + ordered key list, both derived from THEME_DEFINITIONS.
export const themeMetadata = Object.fromEntries(
  THEME_DEFINITIONS.map((t) => [
    t.key,
    { name: t.name, description: t.description, preview: t.preview },
  ]),
) as Record<ThemePersonality, ThemeMetadata>;

export const themeOrder = THEME_DEFINITIONS.map(
  (t) => t.key,
) as ThemePersonality[];

// Old theme names for migration (renamed/removed personalities → default).
const OLD_THEME_NAMES = ["warm-bento", "brutalist", "swiss-poster", "analog"];

// Local storage keys
export const PERSONALITY_STORAGE_KEY = "earned-personality";

// Default theme = the first entry in THEME_DEFINITIONS.
export const defaultThemeConfig: ThemeConfig = {
  personality: THEME_DEFINITIONS[0].key,
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
