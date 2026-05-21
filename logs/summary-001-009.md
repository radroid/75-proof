# Loop summary — iters 001 through 009

The first decade of the Earned UX transition loop. All PRs targeted `ux-refresh-simplified-challenge-driven`; nothing merged to `main`.

## Closed tasks

| Iter | PR | TaskList | One-line scope |
|------|------|------|-------|
| 001 | #52 | #22 | `/offline` Earned visual restyle (cream paper, gold star, Caveat) |
| 002 | #53 | #28 | extract `Star`/`HandCheckbox`/`PaperChip`/`HandHabitRow` into `components/earned/` |
| 003 | #54 | #24 | hoist design system to installable Claude skill at `.claude/skills/earned-design/` |
| 004 | #55 | — | bookkeeping iter: state.json + latest.md catch-up |
| 005 | #56 | #29, #31 | Phase 5 voice migration: vocab swap + dialog copy rewrites |
| 006 | #57 | — (baseline for #32) | settings CSS-overlay restyle: Caveat card titles, dashed row separators |
| 007 | #58 | — | `EarnedRow` primitive + Caveat page-header treatment |
| 008 | #59 | — | first 4 hand-drawn icons (palette/calendar/bell/shield) + theme-card sticker shadow |
| 009 | #60 | #32 | last 7 icons + handwritten value treatment; **closed #32** |

## Key decisions
- **PR-mode + integration branch.** Every iter ships its own sub-branch → PR → CodeRabbit → squash-merge into `ux-refresh-simplified-challenge-driven`. `main` stays untouched until Phase 9. Captured in CLAUDE.md.
- **CSS-overlay baseline before JSX rewrite.** iter-006 shipped notebook feel via `[data-theme="earned"]` rules on shadcn Card data-slots — zero JSX edits. iter-007+ then layered JSX changes where CSS alone couldn't reach (PageHeader, dashed-row dependencies on direct children).
- **Per-iter design-review subagent over Playwright.** Auth-gated routes (`/dashboard/*`) make Playwright capture more flake than signal. We substituted a Class A read-only reviewer reading the diff + design-system reference. Caught real bugs in iter-007 (non-Earned theme spacing regression), iter-008 (comment drift + shield cohesion nit), iter-009 (set coherence notes).
- **Hand-drawn icon swap via `ThemedIcon` wrapper** — `useThemePersonality() === "earned"` picks the Earned variant, Lucide otherwise. Settings page is now Lucide-free. Bundle cost considered acceptable below ~30 icons; dynamic-import deferred until then.
- **Iconography rule formalised.** 1.7px ink stroke (within the 1.5–2px spec), round caps/joins, slight rotation ∈ [-2°, +2°]. Each glyph carries a small interior mark (palette dabs, calendar dots, shield checkmark, etc.) for set coherence.
- **`data-earned-value` attribute for "protagonist number" copy.** Caveat 1.5rem via CSS under `[data-theme="earned"]`. Avoids touching layout — works on existing `<p>` tags.
- **Bookkeeping deferral pattern.** When two PRs are in flight that both touch `.loop/state.json` + `logs/latest.md`, only one updates them; the other defers to a follow-up iter to avoid merge conflicts.

## Design-review patterns that emerged
- **Always restate the design-system rule.** Each review prompt cited `design-system/project/README.md` § sections explicitly so the reviewer didn't have to guess priors.
- **Reviewer catches non-Earned regressions reliably.** Twice across the decade (iter-007, iter-009) the reviewer flagged a non-Earned theme implication the implementer hadn't considered — usually a Tailwind utility removal that worked under Earned's higher-specificity override but broke arctic/broadsheet/military/zen.
- **APPROVE_WITH_FOLLOWUPS is the normal verdict.** Across the 5 UI-bearing iters that had reviews (006-009 inclusive — 4 reviews), 4/4 came back APPROVE_WITH_FOLLOWUPS. BLOCK never fired. Pattern: cap scope tight, ship the pragmatic baseline, queue refinements as concrete next-iter items.

## Notes for future iters
- `/dashboard/settings` is the canonical reference for "how to Earned-restyle a card-heavy surface" — see CSS in `app/globals.css` lines ~520-640.
- Phase 2 progress restyle (`/dashboard/progress`) is the natural next big surface — L-sized, will likely span 2-3 iters.
- Phase 1 motion polish on EarnedDashboard checkbox lands in iter-010.
- Per-iter logs 001-009 archived under `logs/archive/` — read the per-iter file only when you need a specific implementation note. This summary is the canonical entry-point.
