---
name: earned-design
description: Use this skill when building, restyling, or reviewing any Earned (75-proof) UI surface — for production code, prototypes, or visual artifacts. Contains the brand voice rules, visual foundations, palette, type, iconography conventions, and design tokens. Auto-load for any task that touches Earned-themed components, copy, push-notification text, or design-system primitives.
user-invocable: true
---

# Earned design skill

The canonical brand guide for **Earned** — the research-driven, notebook-style habit tracker. This skill is auto-discovered inside the `75-proof` repo so any Claude Code session can load the brand rules without the developer having to point them out.

## Where the content lives

The full guide is checked into the repo at `design-system/project/`. This skill is intentionally a thin pointer rather than a duplicate copy so the brand book has a single source of truth.

**Read these first**, in order, for any Earned-design task:

1. `design-system/project/README.md` — brand description, voice rules, visual foundations, colour palette, type, iconography. Start here for every task that ships UI copy or visuals.
2. `design-system/project/colors_and_type.css` — the authoritative design tokens. Treat the `:root { … }` block as the contract; do not invent new colour hex values when a token exists.
3. `design-system/project/assets/star.svg` — the canonical brand star path. Re-use the same SVG path in any component that renders a star; do not redraw it.

When you need richer reference material:

- `design-system/project/preview/*.html` — standalone preview cards demonstrating each token / component pattern (buttons, chips, calendar, habit row, etc.).
- `design-system/project/ui_kits/earned-ios/` — interactive iOS prototype with Today, Journal, Stars, and Me screens.

## Production code mapping

When writing production code (not throwaway artifacts), use the extracted primitives instead of redrawing from scratch:

- `@/components/earned/Star` — the brand star at any size.
- `@/components/earned/HandCheckbox` — three states (`empty | star | locked`); `locked` self-disables, do not also pass `disabled`.
- `@/components/earned/PaperChip` — sticker-shadow pill (`cream | gold | sky`).
- `@/components/earned/HandHabitRow` — the full Today list row.

The CSS tokens are wired through Tailwind v4's `[data-theme="earned"]` block. Inside an Earned surface, prefer `var(--earned-…)` over inline hex.

## Voice rules — restated for muscle memory

These are also in `design-system/project/README.md` and `CLAUDE.md` but copied here so the skill is self-sufficient on a single read:

- **First person.** "Today I showed up." Never "You completed X."
- **Sentence case.** No title-case headings. No trailing exclamation marks.
- **No emoji in product UI.** Carve-outs only for user-entered content (habit names, journal entries, reaction-emoji content the user picked). Stars (★) and checks (✓) replace them.
- **Word swaps:** Completed → Showed up · Failed → Skipped · Score → Streak · Goal → Habit · Today's tasks → Today's page.
- **Errors stay clear but kind.** "That didn't save — try again?" not "Failed to update."

## Visual rules — restated for muscle memory

- **Palette:** cream paper `#F4ECD8`, ink `#1F1F1D`, star gold `#D8A830`, sky `#0090D8`. Rose `#C75F4A` and sage `#7A8C6B` appear sparingly.
- **Type:** Caveat (handwritten) for moments + big numbers; Poppins for structure.
- **Strokes:** 1.5–2px ink, round caps/joins, slight hand-trembled SVG paths. Never icon-library defaults inside Earned surfaces.
- **Loading:** no spinners. Handwritten "loading…" with a subtle scribble; reduced-motion users see a static "…".
- **Sticker shadow** on accent chips: `2px 2px 0 var(--earned-ink)`.

## Other themes

The product also ships `arctic`, `broadsheet`, `military`, and `zen` themes. Their rules are different and live in `components/themes/*-dashboard.tsx` plus `app/globals.css`. **Do not** apply the Earned rules above to those surfaces — they have their own voice and palette.

## Installing this skill elsewhere

This skill is checked into the repo at `.claude/skills/earned-design/` so it loads automatically inside `75-proof`. To make it available globally on your machine, copy the directory into `~/.claude/skills/`:

```bash
cp -r .claude/skills/earned-design ~/.claude/skills/
```

Once installed globally, Claude Code sessions in any project will see it. The body of this SKILL.md references files under `design-system/project/` by relative path — those references resolve correctly from `75-proof` checkouts; from other projects you would need to clone or vendor the brand book.
