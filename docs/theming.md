# Theming

This app ships **5 visual themes** ("personalities"). The default is **earned**
(cream paper notebook, ink + sky, a gold star reward). Users switch themes from
Settings → Appearance and during onboarding.

This doc explains how theming works and — most importantly — **how to add a new
theme with the fewest possible edits.**

---

## How it works

Theming is plain CSS custom properties + a `data-theme` attribute. No runtime
style injection, no FOUC for the default theme.

1. **`app/globals.css`** defines one block of CSS variables per theme:

   ```css
   :root,
   [data-theme="earned"] { /* …tokens… */ }   /* default lives on :root too */
   [data-theme="arctic"] { /* …tokens… */ }
   [data-theme="broadsheet"] { /* … */ }
   /* etc. */
   ```

   The default theme's block is attached to `:root` as well, so the correct
   colors are present at SSR before any JS runs.

2. **`@theme inline { … }`** (top of `globals.css`) maps those CSS variables to
   Tailwind utility classes — e.g. `--color-primary: var(--primary)` makes
   `bg-primary` / `text-primary` resolve to the active theme's `--primary`.
   **You do not edit this when adding a theme.**

3. **`components/theme-provider.tsx`** reads the stored personality from
   `localStorage` and sets `document.documentElement.dataset.theme`. Components
   never read the theme directly — they just use semantic Tailwind utilities
   (`bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `border-border`,
   …) and automatically restyle when the attribute changes.

4. **`lib/themes.ts`** is the **single source of truth** for the list of themes,
   their display metadata, their order, and which one is the default.

---

## The single source of truth: `THEME_DEFINITIONS`

`lib/themes.ts` exports everything else from one ordered array:

```ts
const THEME_DEFINITIONS = [
  { key: "earned", name: "Earned", description: "…", preview: { bg, fg, accent, card } },
  { key: "arctic", … },
  …
] as const satisfies readonly ThemeDefinition[];

export type ThemePersonality = (typeof THEME_DEFINITIONS)[number]["key"];
export const themeMetadata = /* derived */;
export const themeOrder    = /* derived */;
export const defaultThemeConfig = { personality: THEME_DEFINITIONS[0].key };
```

- The **union type** `ThemePersonality` is derived from the array — add a theme
  and the type updates itself.
- `themeMetadata` and `themeOrder` are derived too.
- **Index 0 is the default theme** and the first one shown in the switcher.
- `preview` is the four-swatch mini-preview shown on the theme card.

---

## Add a new theme

Minimum: **two edits.** Everything else has a fallback.

### 1. Register it — `lib/themes.ts`

Add one object to `THEME_DEFINITIONS`. Position matters only for ordering
(index 0 = default).

```ts
{
  key: "midnight",
  name: "Midnight",
  description: "Deep indigo, warm amber accents",
  preview: { bg: "#0b1020", fg: "#e7e9f3", accent: "#f0a020", card: "#141a2e" },
},
```

### 2. Style it — `app/globals.css`

Copy the **`[data-theme="…"]` template** block (it's the commented block right
above the theme blocks) and fill in every variable. Use a real example like the
arctic or earned block as a reference for sensible values.

You must define the full token set (see [Token checklist](#token-checklist)).
Missing a variable means it falls back to the previous cascade value, which is
usually wrong — define them all.

That's it. The theme now works everywhere: switcher, onboarding, dashboard,
settings, all shared components.

### Optional polish

3. **Custom switcher preview** — add an entry to `themeSignatures` in
   `components/theme-switcher.tsx` (font, badge shape, a background "flourish").
   Omit it and a clean `DEFAULT_SIGNATURE` preview is used.

4. **Bespoke dashboard layout** — create
   `components/themes/<key>-dashboard.tsx` and register it in the
   `dashboardComponents` map in `app/(dashboard)/dashboard/page.tsx`. Omit it and
   the **token-driven `EarnedDashboard`** is used — it reads only semantic tokens,
   so it renders correctly under any theme's variables.

---

## Token checklist

Every `[data-theme]` block defines these (copy from an existing theme):

| Group | Variables |
| --- | --- |
| Radius | `--radius` |
| Fonts | `--font-body`, `--font-heading`, `--font-code` |
| Brand | `--primary`, `--primary-foreground` |
| Surfaces | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground` |
| Neutrals | `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground` |
| Status | `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--destructive`, `--destructive-foreground` |
| Lines | `--border`, `--input`, `--ring` |
| Charts | `--chart-1` … `--chart-5` |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` |
| Shadows | `--shadow-color`, `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`, `--shadow-card`, `--shadow-card-hover` |
| Glows | `--glow-success`, `--inner-glow-success` |
| Motion | `--duration-fast`, `--duration-normal`, `--duration-slow` |
| Gradients | `--gradient-primary`, `--gradient-accent` |
| Mobile nav | `--nav-bg`, `--nav-shadow`, `--nav-indicator`, `--nav-radius` |

A foreground (`-foreground`) token is the text/icon color that sits **on** its
paired surface — make sure the pair passes WCAG AA contrast.

---

## Writing theme-safe components

So new themes "just work," components must use **semantic tokens**, never
hardcoded colors:

| Use | Not |
| --- | --- |
| `bg-background` / `text-foreground` | `bg-white` / `text-black` |
| `bg-card`, `bg-popover` | `bg-gray-50`, `bg-[#fff]` |
| `text-muted-foreground` | `text-gray-500` |
| `bg-primary` / `text-primary-foreground` | `bg-blue-600` / `text-white` |
| `border-border`, `ring-ring` | `border-gray-200` |
| `bg-destructive`, `text-destructive` | `bg-red-500` |
| `var(--font-heading)` / inherit | `font-family: 'Inter'` |

**Exceptions that are intentionally NOT themed (brand-locked):**

- `app/page.tsx` — the marketing landing page (always the earned brand)
- `app/opengraph-image.tsx`, `app/icon.svg`, `app/apple-icon.png`,
  `public/icon-*.png`, `public/logo.svg`, `public/star.svg` — brand assets
- `components/themes/<key>-dashboard.tsx` — each bespoke dashboard hardcodes
  **its own** theme's look on purpose
- Modal/overlay scrims (`bg-black/50` etc.) — theme-agnostic by design

---

## Brand assets

The earned brand mark is the **gold star** (`public/star.svg`, sampled
`#D8A830`). App/PWA icons are the star on a sky tile, generated by
`scripts/generate-icons.mjs` (run `node scripts/generate-icons.mjs` after
changing the star). The wordmark is "earned" with a star motif — cream-on-sky
(`public/logo-light.png`) or ink-on-cream (`public/logo-dark.png`).
