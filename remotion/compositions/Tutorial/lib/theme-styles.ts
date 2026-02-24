export type ThemeName = "arctic" | "broadsheet" | "military" | "zen";

export type ThemeStyle = {
  bg: string;
  fg: string;
  primary: string;
  primaryFg: string;
  card: string;
  cardFg: string;
  secondary: string;
  muted: string;
  mutedFg: string;
  accent: string;
  accentFg: string;
  success: string;
  successFg: string;
  border: string;
  fontHeading: string;
  fontBody: string;
};

export const themeStyles: Record<ThemeName, ThemeStyle> = {
  arctic: {
    bg: "#ffffff",
    fg: "#111111",
    primary: "#2563eb",
    primaryFg: "#ffffff",
    card: "#f8fafc",
    cardFg: "#111111",
    secondary: "#f0f4f8",
    muted: "#f0f0f0",
    mutedFg: "#6b7280",
    accent: "#2563eb",
    accentFg: "#ffffff",
    success: "#16a34a",
    successFg: "#ffffff",
    border: "#e5e7eb",
    fontHeading: "'Instrument Sans', 'DM Sans', system-ui, sans-serif",
    fontBody: "'DM Sans', 'Inter', system-ui, sans-serif",
  },
  broadsheet: {
    bg: "#f5f0e8",
    fg: "#1a1410",
    primary: "#1a1410",
    primaryFg: "#f5f0e8",
    card: "#f5f0e8",
    cardFg: "#1a1410",
    secondary: "#ebe3d5",
    muted: "#e8e0d4",
    mutedFg: "#8a7e70",
    accent: "#9e2a2b",
    accentFg: "#ffffff",
    success: "#2d6a4f",
    successFg: "#ffffff",
    border: "#d4cdc0",
    fontHeading: "'Lora', 'Georgia', serif",
    fontBody: "'Crimson Pro', 'Georgia', serif",
  },
  military: {
    bg: "#1a1f14",
    fg: "#c2b280",
    primary: "#4ade80",
    primaryFg: "#0a0f06",
    card: "#1e2518",
    cardFg: "#c2b280",
    secondary: "#252d1e",
    muted: "#2a331f",
    mutedFg: "#5a6b44",
    accent: "#c2b280",
    accentFg: "#1a1f14",
    success: "#4ade80",
    successFg: "#0a0f06",
    border: "#2a331f",
    fontHeading: "'Black Ops One', 'Impact', sans-serif",
    fontBody: "'IBM Plex Mono', 'Courier New', monospace",
  },
  zen: {
    bg: "#f7f3ee",
    fg: "#2b2622",
    primary: "#6b7c5e",
    primaryFg: "#f7f3ee",
    card: "#f7f3ee",
    cardFg: "#2b2622",
    secondary: "#efe9e0",
    muted: "#e8e2d9",
    mutedFg: "#9a928a",
    accent: "#c4956a",
    accentFg: "#ffffff",
    success: "#6b7c5e",
    successFg: "#ffffff",
    border: "#e8e2d9",
    fontHeading: "'Cormorant Garamond', 'Georgia', serif",
    fontBody: "'Karla', system-ui, sans-serif",
  },
};
