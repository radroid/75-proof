---
name: earned-design
description: Use this skill to generate well-branded interfaces and assets for Earned (the research-driven, notebook-style habit tracker), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, brand assets (logos + star), and an iOS UI kit with hand-drawn components.
user-invocable: true
---

# Earned design skill

Read `README.md` in this skill first — it covers the brand voice, visual foundations, and iconography rules. Then explore the other available files:

- `colors_and_type.css` — drop-in token sheet. Import this into any new HTML artifact and every color / type / spacing / shadow / motion variable becomes available.
- `assets/` — logos (mark, wordmark) and the canonical brand `star.svg`. Copy these out when building artifacts; do not redraw them.
- `preview/` — small standalone HTML cards demonstrating each token / component pattern. Useful as reference.
- `ui_kits/earned-ios/` — iOS-first interactive prototype with Today, Journal, Stars, and Me screens. JSX components are modular (`components.jsx`, `screens.jsx`); reuse `Star`, `Checkbox`, `HabitRow`, `Chip`, `HandButton`, `PaperBg`, `BottomNav`, `PageHeader` directly.

## Working with this skill

**If creating visual artifacts (slides, mocks, throwaway prototypes):**
1. Copy the assets you need (`assets/logo-*.png`, `assets/star.svg`) into your artifact's folder.
2. Link `colors_and_type.css` (or inline its `:root { … }` block).
3. Compose using the conventions: Poppins for structural type, Caveat for handwritten moments, cream ruled paper as the default surface, the gold star **only** as a reward.
4. Reach into `ui_kits/earned-ios/components.jsx` for ready-made React/JSX building blocks.

**If working on production code:**
- Read the rules in `README.md` and treat the CSS variables in `colors_and_type.css` as authoritative tokens.
- The JSX components are intentionally cosmetic — port the visual behavior to your real component library; don't ship them as production code.

**Hard rules:**
- Address the user in **first person** ("Today I…", not "You did it!").
- No emoji in product UI. Stars (★), checks (✓), and ink doodles only.
- The gold brand star is the reward currency — never decorative.
- Cream + ink + sky + gold is the full palette. Rose and sage appear sparingly.

**If the user invokes this skill without further guidance:** ask what they want to build, ask a few questions about screen / surface / tone, then act as an expert designer producing HTML artifacts or production code.
