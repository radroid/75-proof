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

// The app-wide default before the "earned" rebrand (#94). Every browser that
// first loaded the app back then had "arctic" silently written to localStorage
// (the old code persisted the default on first read), so those users are pinned
// to arctic forever — arctic is still a valid, selectable theme, so it never
// migrates like a removed theme would. We reset those stale pins to the new
// default ONCE, guarded by THEME_RESET_STORAGE_KEY, so anyone who deliberately
// re-picks arctic afterward keeps it.
const LEGACY_DEFAULT_THEME = "arctic";

// Local storage keys
export const PERSONALITY_STORAGE_KEY = "earned-personality";
// Set to "1" the first time we run the one-time legacy-default reset below.
export const THEME_RESET_STORAGE_KEY = "earned-personality-reset-v1";

// Default theme = the first entry in THEME_DEFINITIONS.
export const defaultThemeConfig: ThemeConfig = {
  personality: THEME_DEFINITIONS[0].key,
};

/**
 * Read the persisted personality and apply migrations, writing back any change
 * so the stored value stays canonical. Client-only (touches localStorage).
 *
 * Order:
 *  1. Removed-theme migration — OLD_THEME_NAMES → default, on every load.
 *  2. One-time legacy-default reset — a browser silently pinned to the
 *     pre-rebrand default ("arctic") is moved to the current default ONCE,
 *     guarded by THEME_RESET_STORAGE_KEY. A later deliberate pick still sticks.
 */
export function resolveStoredPersonality(): ThemePersonality {
  if (typeof window === "undefined") return defaultThemeConfig.personality;
  const def = defaultThemeConfig.personality;
  const stored = localStorage.getItem(PERSONALITY_STORAGE_KEY);

  // The legacy-default reset runs on the first resolve for this browser,
  // whichever branch handles that load. Capture and set the marker up front so
  // the removed-theme migration (which returns early) can't leave it unset and
  // wrongly reset a later deliberate "arctic" pick.
  const firstResolve = localStorage.getItem(THEME_RESET_STORAGE_KEY) !== "1";
  if (firstResolve) localStorage.setItem(THEME_RESET_STORAGE_KEY, "1");

  // 1. Removed themes always migrate to the current default.
  if (stored && OLD_THEME_NAMES.includes(stored)) {
    localStorage.setItem(PERSONALITY_STORAGE_KEY, def);
    return def;
  }

  // 2. One-time reset of the stale pre-rebrand default.
  if (firstResolve && stored === LEGACY_DEFAULT_THEME) {
    localStorage.setItem(PERSONALITY_STORAGE_KEY, def);
    return def;
  }

  if (stored && stored in themeMetadata) return stored as ThemePersonality;
  return def;
}

/** @deprecated Use {@link resolveStoredPersonality}. Kept for back-compat. */
export function getStoredPersonality(): ThemePersonality {
  return resolveStoredPersonality();
}

export function setStoredPersonality(personality: ThemePersonality): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERSONALITY_STORAGE_KEY, personality);
}
