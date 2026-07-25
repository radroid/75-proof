# Progress restyle + earned-primitives extraction — implementation plan

Plan for Backlog *Now* #6 (restyle `/dashboard/progress` to earned paper) and its
prerequisite *Next* item (extract shared earned primitives). Produced 2026-07-24.

## Sequencing gate (READ FIRST)

Execute this **only after** the in-flight small-item PRs land on `main`:
- #99 streak (`earned-dashboard.tsx`), #101 instrumentation (`EarnedChecklist.tsx`),
  #103 focus-rings (`EarnedPaper.tsx` L605/L838/L882), #104 gold-star (`EarnedPaper.tsx` L66).

Extraction relocates the very bodies those PRs edit (`EarnedCheckbox`, `EarnedHabitRow`,
`EarnedStar`) and rewrites `DayArrow`/`StepButton` which live in `earned-dashboard.tsx` /
`EarnedChecklist.tsx`. Starting before they merge = conflicts + the silent "rings land on
the dead copy" failure. Clean `main` first.

## 1. Extraction — what's real

Only two files import from `EarnedPaper.tsx`: `earned-dashboard.tsx:5-15`,
`EarnedChecklist.tsx:24`. Of the backlog's 5 candidate primitives, **4 already exist as
clean exports** (just relocate): `EarnedChip`→`PaperChip`, `EarnedCheckbox`→`HandCheckbox`,
`EarnedPageHeader`→`PageHeader`, `PaperSurface`+`EarnedPaperDefs`→`PaperBg`.

**Only `HandButton` is genuinely new** — the hand-drawn ink-border + hard-offset-shadow +
`url(#earned-rough-soft)` recipe is triplicated inline: `DayArrow` (`earned-dashboard.tsx:57-102`),
`StepButton` (`EarnedChecklist.tsx:56-98`), reset-stars pill (`earned-dashboard.tsx:402-431`).
Unify into one `HandButton({ shape: "square"|"round"|"pill", size, onClick, disabled,
aria-label (required), children })`, with a **visible `:focus-visible` ring baked in** (same
a11y gap being fixed on Today).

### Layout + back-compat
```
components/earned/primitives/
  tokens.ts (EC,HAND,SANS,STAR_PATH) · PaperBg · PaperChip · HandCheckbox
  HandButton (new) · PageHeader (+EarnedPrompt) · HabitRow · Star (EarnedStar+Reward) · index.ts
```
Keep `EarnedPaper.tsx` as a **re-export shim** (`export * from "@/components/earned/primitives"`)
so consumers never change import paths — this keeps the streak/instrumentation PRs orthogonal.

## 2. PR breakdown (each own branch, squash-merge)

- **PR A — Extraction Wave A (uncontested + HandButton):** move tokens/PaperBg/PaperChip/
  PageHeader; add HandButton; rewrite DayArrow/StepButton/reset-pill as HandButton wrappers.
  Shim stays. No visual change. *(Touches earned-dashboard.tsx + EarnedChecklist.tsx, so land
  AFTER #99/#101.)*
- **PR B — Extraction Wave B (contested):** move HandCheckbox/HabitRow/Star. **After #103/#104.**
- **PR C — Progress: TodaySnapshot + HeadlineMetrics + IdentityCard.** (needs A)
- **PR D — Progress: CalendarGrid + HabitHeatmap + PerHabitList.** (needs A)
- **PR E — Progress: page chrome + History timeline.** (needs A, +B for timeline dots)
- **PR F (optional) — Friends tab + shared section-heading coherence.**

## 3. Restyle rules (deviate from the archive deliberately)

Reference `git diff main archive/umbrella-ux-refresh -- app/(dashboard)/dashboard/progress/page.tsx components/progress`, but:

1. **`var(--earned-*)` tokens DO NOT EXIST on main** (only on the archive's globals.css L423+).
   Replace every `var(--earned-star-gold|ink|cream-*|sky|rose)` with `EC.*` from `tokens.ts`.
   Verbatim cherry-pick = invisible/black styling.
2. **Unconditional, not gated.** Archive wraps each restyle in `useThemePersonality() === "earned"`.
   Collapse to the single earned path (one `=== "earned"` hit repo-wide is the target). Don't
   import `useThemePersonality` into progress components.
3. **A11y from the start:** visible `:focus-visible` on HandButton + every restyled control;
   preserve existing `aria-label`s (History expand `page.tsx:877`, Select items) and CalendarGrid
   cell `title`/aria state descriptions. Archive's raw `<button border:none>` styling has the same
   ring gap just fixed on Today — don't inherit it.

Per-block targets: page header→`PaperBg`+`PageHeader`; stat tiles→paper cards + `ThemedIcon`
(flame/trending-up) + `EarnedStar`; CalendarGrid→sticker cells (gold earned / sky today /
`CrossMarkEarned` missed / dashed future); HabitHeatmap→ink-density ramp; PerHabitList→ink
sparkline + `ThemedIcon` trend chips; History timeline→ink timeline, `HandCheckbox`/`EarnedStar`
dots, filter buttons→`HandButton`. `TodaySnapshot` is net-new (adapt archive `today-snapshot.tsx`
to paper + add `todayStats` useMemo + `progress_to_log_tap` event). Swap all lucide → `ThemedIcon`.

## 4. Risks
- **Missing `--earned-*` tokens (highest):** see rule 1.
- **Gating drift:** see rule 2.
- **A11y regressions:** see rule 3.
- **Merge order:** the `EarnedPaper.tsx` shim keeps consumer imports stable; sequence Wave B after
  #103/#104.
- **Stale service worker** (`public/sw.js` CACHE_NAME "earned-v1"): serves stale precached CSS on
  branch switch while TSX Fast-Refreshes — "restyle isn't taking" ⇒ unregister SW / hard reload /
  bump CACHE_NAME. (Now documented in CLAUDE.md via PR #102.)
- **Data coupling: low** — progress components are presentational; only `TodaySnapshot`'s
  `todayStats` adds a memo over already-loaded data (guard `undefined` queries as 0/0).
