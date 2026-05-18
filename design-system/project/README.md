# Earned — Design System

> *A research-driven habit builder. Find habits you'll keep — pair them with any book you're reading, and earn a star for every day you show up.*

**Earned** is a habit tracker that feels like a personal notebook. Every day is a fresh page. Habits are written in by hand. Each completed day earns a star (the brand's namesake). It descends from the strictness of 75 Hard but trades rigidity for flexibility — some habits are time-boxed challenges, others run forever.

This design system codifies the look, feel, voice, and component vocabulary so any designer or engineer can build new surfaces of the product without rebuilding the brand from scratch.

---

## Sources used to build this system

- **Logos**: provided by the user — `Black and Beige Modern Stars Logo - 6.png` (mark on cream) and `Black and Beige Modern Stars Logo - 7.png` (blue wordmark). Sampled directly for the palette.
- **Reference repo**: [`radroid/75-proof`](https://github.com/radroid/75-proof) — the earlier 75-day-challenge version of the product. Not loaded into this system (GitHub was not connected at build time) but the reader should explore it for production code patterns, data models, and any in-flight UI work.
- **Reference apps**: [MyScript Nebo / Notes](https://www.myscript.com/notes/) for the handwritten + structured-document feel; Apple's iPadOS marketing pages for the polish and restraint we're aiming for.

> **Reader note** — if you have access to the repo above, please explore it before producing new designs. This system gives you the brand foundations; the repo gives you product reality.

---

## Index

| File | What it contains |
|------|------------------|
| `colors_and_type.css` | All design tokens — colors, type scale, spacing, radii, shadows, motion. Import this into any HTML artifact. |
| `assets/` | Brand logos (mark + wordmark, black and blue variants) and shared visual assets. |
| `preview/` | Standalone HTML cards that populate the Design System preview tab. One concept per card. |
| `ui_kits/earned-ios/` | iOS-first interactive prototype. Today screen + Journal entry. JSX components, click-thru `index.html`. |
| `SKILL.md` | Cross-compatible Agent Skill description. Use this skill to generate Earned-branded artifacts. |

---

## Content Fundamentals

The product addresses the user **in the first person** — *"Today I…"*, *"I showed up."*, *"I earned a star."* The app is the user's own notebook; copy reads like an internal voice, not a coach barking instructions. Onboarding may calibrate this tone (warm/playful/calm/tough-love), but the default voice is **personal and journal-like**.

**Tone**:
- Warm, observational, lightly poetic.
- Restrained — never cheerleading, never excessive.
- Habits are *named*, not "tracked." Days are *shown up for*, not "completed."

**Casing**:
- **Sentence case everywhere.** No title case for headings.
- Handwritten headings respect case but allow a `Capitalized First Word` and lower-case rest, like real handwriting.

**Word choices** (use this column, not that one):
| Use | Avoid |
|-----|-------|
| Showed up | Completed |
| Streak | Score |
| Earned a star | Got points / achievements |
| Today's page | Today's tasks |
| Skipped | Failed |
| Rest day | Off day |
| Habit | Goal / target |
| The book | Reading material |

**Punctuation**:
- Em-dashes for asides, like a margin note. Avoid semicolons.
- Ellipses are fine and feel handwritten.
- Sentence-final punctuation is sometimes omitted in handwritten captions ("Day 12" not "Day 12.").

**Numbers**: handwritten where the number is the protagonist (day counter, streak count, big totals). Sans where it's data (timestamps, percentages, ordinal labels).

**Emoji**: ❌ no emoji in the product UI. Stars (★), checkmarks (✓), and hand-drawn ink doodles replace anywhere emoji would land. The only exception is user-entered text (their habit names, their journal); we don't strip those.

**Examples — voice in action**:
- Empty journal page: *"Today I…"* (placeholder, hand-script)
- Day complete: *"I showed up. Star earned."*
- Streak broken: *"Yesterday slipped by. Today's a fresh page."* (never "you failed")
- New habit prompt: *"What am I trying to build?"*
- Rest day banner: *"Resting on purpose."*

---

## Visual Foundations

**The metaphor**: every screen is a page in the user's notebook. The page comes first; the app chrome lives quietly on top.

**Surfaces & backgrounds**:
- Default surface is **cream ruled paper** (`--bg` + `.paper-ruled`). Horizontal rules at every 32px; an optional red margin line 32px from the left edge.
- Cards lift off the page on a soft, warm paper shadow — never the cold grey of typical UI shadows.
- Full-bleed photography is rare; when present, it's warm and slightly grainy. Cool/clinical imagery is off-brand.
- Repeating textures and subtle paper grain are welcome; gradients are not (with one exception: the gold "star earned" reward burst).

**Colors** — sampled from the logos:
- **Cream** `#F4ECD8` — the page. Background of every screen.
- **Ink** `#1F1F1D` — every stroke of text, every drawn line. Near-black with a touch of warmth.
- **Sky blue** `#0090D8` — the wordmark color. Interactive states, primary actions, links, "today" highlight.
- **Star gold** `#D8A830` — the namesake reward. Reserved for earned stars, streak celebrations, and never as a decorative accent.
- **Ink red** `#C75F4A` — sparingly: missed-day mark, the margin rule, destructive actions.
- **Sage** `#7A8C6B` — rest days, "paused" states.

**Type**:
- **Poppins** for everything structural — navigation, dates, data, dense reading. Weights 400/500/600/700.
- **Caveat** (Google Fonts) for everything handwritten — page titles, habit names, big numbers, captions like "Done!". Caveat is the picked secondary face: warm, modern, highly legible. **Kalam** and **Patrick Hand** are exposed as tweaks for stylistic exploration.

**Spacing**: 4px grid (`--space-1` through `--space-8`). The vertical rhythm of `--rule-gap: 32px` matches the paper rule — body text and form rows align to this baseline wherever feasible.

**Borders**: solid 1.5px ink (`--border`) with **slight imperfection** — buttons, cards, and checkboxes are drawn with a hand-trembled SVG stroke rather than a clean CSS border. Where pure CSS is used, a 1.5px ink line is the standard.

**Radii**: paper has no rounded corners, so we mostly stay at `--r-0` and `--r-1` (2px). Floating chips/buttons/sticker-cards use `--r-3` (10px). Pills (`--r-pill`) only for status chips.

**Shadows** — two families, distinct purposes:
- **Paper** (`--shadow-paper-*`): warm, soft, multi-layered. Lifts a card off the page.
- **Ink** (`--shadow-ink`): a 2px hard black drop, no blur. Makes an element feel **stuck on** like a sticker — used for the daily streak chip, earned-star badges.

**Animation**:
- Default ease is **soft overshoot** (`--ease-paper`) — like a page settling onto the desk.
- Checking off a habit: ink stroke draws onto the box (300ms), then a subtle paper-crinkle scale to 1.02 and back.
- Earning a star: gold mark appears with a quick 1.0 → 1.2 → 1.0 pop, plus a 3-spoke ink burst that fades out.
- Page transitions: horizontal slide with a small lift (mimicking turning a page). Never crossfade.
- No spinners — when something's loading, a pen scribbles a small loop.

**Hover / press states** (touch-first, but for web prototypes):
- **Hover**: ink darkens 8% (using `color-mix` or direct token swaps), no scale.
- **Press**: scale to 0.97, no color shift on primary actions. On checkboxes, ink stroke begins drawing.

**Transparency / blur**: minimal. Modal scrims are a 60% ink overlay, no blur. iOS-native blur is fine in the status bar / navigation chrome only.

**Imagery vibe**: warm, slightly desaturated, with film grain. Hand photographs of books, pens, mugs. No flat illustrations. No 3D renders. If we need an icon for a category, prefer a hand-drawn line over a stock SVG.

**Layout rules**:
- Mobile-first. iOS as the primary canvas (390 × 844, iPhone 16-ish).
- Safe-area-respecting bottom nav, but the nav itself is a *paper strip* with a torn-edge top.
- Headers stay simple: page title + date, both handwritten.
- Content respects the ruled paper baseline; cards may break it for emphasis.

---

## Iconography

**Approach**: rough-stroke, hand-drawn line icons. No icon font is loaded by default. The product uses:

1. **Bespoke ink-stroke SVGs** — drawn with a slight wobble (1.5–2px stroke, `stroke-linecap: round`, `stroke-linejoin: round`, occasionally a 1° rotation to feel hand-placed). Examples: the checkbox tick, the star, dividers.
2. **[Lucide](https://lucide.dev)** as a fallback library — its rounded stroke style is closest to our voice. **Linked from CDN** (`https://unpkg.com/lucide@latest`) when a glyph is needed that we haven't drawn. Flag the substitution in code comments.
3. **No emoji.** Star (★), check (✓), and dot (•) unicode glyphs are used inside the handwritten font for inline notation, since Caveat renders them in a way that matches the hand-drawn voice.
4. **No PNG icons.** Everything is vector so it scales on Retina without ceremony.

The hand-drawn star (matching the logo) appears in three sizes:
- **24px** in chips ("3-star day")
- **32px** for earned-today markers
- **96px+** in the celebration moment after a check-in.

Documented in the Brand / Icon Set cards.

---

## Quick start (for designers/engineers picking this up)

1. Open `preview/` cards via the Design System tab to see tokens.
2. Open `ui_kits/earned-ios/index.html` to see the full system applied.
3. Import `colors_and_type.css` into any new artifact — every token will be available.
4. When in doubt about copy, read the **Content Fundamentals** section above out loud — if it doesn't sound like your own internal voice, rewrite it.

---

## Caveats & open threads

- **GitHub repo not connected at build time.** I built from the user's prompt + logo files + reference link. If `radroid/75-proof` contains existing UI patterns, screens, or component decisions, they should override what's here.
- **Handwritten font choice** (Caveat) is my call — Kalam and Patrick Hand are wired up as tweaks for comparison.
- **No real product copy was provided** — voice examples are written in-character for the brand description given. Please replace with real strings as they're authored.
- **Onboarding tone calibration** was mentioned but not designed; the tone column in CONTENT FUNDAMENTALS should be revisited once onboarding flows are defined.
