# Loop summary — iters 011 through 019

Second decade of the Earned UX transition loop. All PRs targeted `ux-refresh-simplified-challenge-driven`; `main` still untouched per CLAUDE.md.

## Closed tasks

| Iter | PR | TaskList | One-line scope |
|------|------|------|-------|
| 011 | #62 | — (first cut of #33) | `/dashboard/progress` first cut — headline metric tiles + calendar grid Earned variant |
| 012 | #63 | — | progress sticker cells (cell IS the sticker) + new `CrossMarkEarned` hand-drawn × |
| 013 | #64 | — | progress heatmap ink-density variant + `EARNED_CELL_STYLES` lookup-table hoist + legend mirror |
| 014 | #65 | **#33** | progress identity card + per-habit sparkline marker-fill + first-person template rewrite |
| 015 | #66 | — (first cut of #34) | friends section first cut — `PaperAirplaneEarned` nudge icon + FriendProgressCard sticker tile + section heading |
| 016 | #67 | — | activity feed hand-drawn icons (Rocket / Trophy / Flame / RotateCw) + Star reuse for day_completed |
| 017 | #68 | — | TodayPulse sticker tile + WeeklyLeaderboard rank Stars + RotateCw arc polish |
| 018 | #69 | **#34** | friend-search `data-earned-input` chrome + 3-up grid shadow forward rule |
| 019 | #70 | **#35** | EmojiPicker + RequestsTab Lucide → ThemedIcon (4 new variants) + universal focus-ring outline override |

## Key decisions
- **Progress page treats the cell AS the sticker** — no inset glyph. Gold-fill + ink-border + 2px shadow for earned days; sky-fill for today; rose-border + CrossMark for missed; dashed cream-dark for future. Codified in `EARNED_CELL_STYLES` lookup table (iter-013) so grid + legend never drift.
- **First-person voice cascade** — iter-014's IdentityCard fix surfaced the identity-template library was still in 2nd person. Rewriting the templates in the same iter prevented a known voice regression from shipping. Reviewer note codified: when the *user-facing* surface shifts to first-person, sweep its data-source for the same shift.
- **Brand Star is the reward currency at every reward semantic** — day_completed (activity feed), all-done celebration (StarBurst), leaderboard ranks 1-2-3 (stepped size 14/12/10 + opacity), challenge_completed gets the new TrophyEarned (distinct glyph keeps the visual hierarchy). Star reuse is allowed across "earned this" contexts; do not use decoratively.
- **Hand-drawn icon set grew 20 entries** — Palette/CalendarDays/Bell/Shield/AlertTriangle/Infinity/Play/Settings/Smartphone/Monitor/Trash (from decade 1) + Rocket/Trophy/Flame/RotateCw/PaperAirplane/CrossMark/Plus/Inbox + reused `close`/`send` aliases. Settings page is Lucide-free; progress + friends + emoji-picker + requests-tab are Lucide-free except where Earned has no semantic equivalent (Lucide remains the fallback for non-Earned themes via ThemedIcon).
- **Universal focus-ring outline under Earned** — sidesteps shadcn `ring-ring/50` alpha composition. `[data-theme="earned"] *:focus-visible { outline: 2px solid var(--earned-sky); outline-offset: 2px; }`. WCAG 3:1 with margin. Cosmetic follow-up: sweep `focus-visible:ring-*` utilities to avoid outline+ring double-stack.
- **3-up grid shadow forward rule** — `[data-earned-grid="cards"] > [data-earned-tile]:nth-child(even)` flips shadow direction; no JSX consumer yet, opt-in for future N-up surfaces.
- **Branch-reset lost-edit hazard** — iter-017 lost edits during `git branch -D` + re-create; reviewer caught it. Pattern: when resetting a branch verify edits via `git status` before continuing.

## Design-review patterns
- Verdict distribution across iters 011-019: **9 reviews, 8 APPROVE_WITH_FOLLOWUPS, 1 BLOCK** (iter-017 — branch-reset lost edits). The reviewer's value is the BLOCK + follow-ups it surfaces mid-iter rather than its terminal verdict.
- **Reviewer regularly catches what the implementer missed.** Examples: iter-013 ramp-step luminance gap, iter-014 second-person template fallback, iter-016 Trophy dead-code under Star reuse, iter-019 PlusEarned invisible rotation, iter-017 lost-edit blocker. Cost is ~30-90s per iter; payoff is real.
- **Apply followups in-iter when small** — iter-014 (template library), iter-016 (Trophy wiring), iter-018 (ring-color), iter-019 (Plus endpoints) all caught reviewer items and fixed mid-iter rather than deferring. This kept tasks from accumulating unfinished closure debt.

## Files modified across the decade
- `app/globals.css` — the central hub. ~10 new `[data-theme="earned"]` rules across the decade (page-title/description, card-title/description/border, data-earned-tile recipes, data-earned-value, data-earned-section-heading, data-earned-input, focus-visible outline, 3-up grid forward rule).
- `components/earned/icons/` — grew from 4 to 20 hand-drawn variants + a stable `ThemedIcon` wrapper.
- `components/progress/calendar-grid.tsx`, `habit-heatmap.tsx`, `headline-metrics.tsx`, `identity-card.tsx`, `per-habit-list.tsx` — all gained Earned variants behind `useThemePersonality()` checks.
- `components/friends/` — friend-progress-card, today-pulse, weekly-leaderboard, friend-search, emoji-picker, requests-tab, activity-feed all Earned-aware.
- `lib/identity-cards.ts` — 10 templates rewritten first-person.

## Notes for future iters
- The iter-006 settings restyle pattern (data-slot CSS targeting shadcn primitives) is the canonical recipe for Earned-restyling a Card-heavy surface without a JSX rewrite. Read iter-006 archived log for the cascade math when the next surface lands.
- `components/earned/icons/themed-icon.tsx` is the single source of truth for the icon swap map. Adding a new variant takes 4 spots: file under `icons/`, barrel export, lucide import, variant map entry.
- Phase 2 surfaces remaining: `/dashboard/coach` (iter-020 starts), `/onboarding` flow, auth (Clerk appearance config), landing/about, error pages partially done (offline shipped iter-001).
- The `EARNED_CELL_STYLES` lookup-table pattern in calendar-grid was a good shape — when a surface has 3+ visual states, hoist styles to a `Record<State, CSSProperties>` so grid + legend + any third consumer can't drift.
- Universal focus-visible outline (iter-019) + earned input rule (iter-018) are both worth porting to a global guideline doc before more surfaces land.

## Per-iter logs 011-019 archived under `logs/archive/`. This summary is the canonical entry-point for the second decade.
