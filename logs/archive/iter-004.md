# iter-004 — bookkeeping + backlog probe

**Scope:** Bookkeeping iter (no feature shipped). 1 PR.
**Branch:** `loop/iter-004-bookkeeping` → PR into `ux-refresh-simplified-challenge-driven`.

## Shipped this turn
- Merged PR #53 (iter-002 — primitives extraction + CR-fix follow-up). CR check was SUCCESS; reviewDecision was sticky CHANGES_REQUESTED because CR explicitly does not re-review already-reviewed commits, but the addressed findings were in commit history.
- Merged PR #54 (iter-003 — design-system skill hoist to `.claude/skills/earned-design/`).
- Reconciled deferred bookkeeping that iter-003 left in carry-forward:
  - `.loop/state.json` iter `2 → 4` and `last_pushed_iter 2 → 4` (catches up the iter-003 backfill).
  - `logs/latest.md` symlink repointed `iter-002.md → iter-004.md`.

## Backlog probe
Cross-referenced TaskList against `docs/EARNED_TRANSITION.md`. Many Phase 1, Phase 5, Phase 7 items are still open but were not in the TaskList. Added 3 high-value, non-blocked items as TaskList entries:

- **#29** Phase 5 — vocabulary swap pass (Completed → Showed up, Score → Streak, Goal → Habit, etc.). Mechanical; immediate UX win.
- **#30** Phase 1 — counter habit incremental logging (tap = +unit, long-press = target). Needs an interaction-model decision before code lands; flag for user.
- **#31** Phase 5 — first-person rewrite of failed/completed/reconciliation dialog copy. Self-contained.

Other unblocked, non-tracked items the loop can pick next: Phase 1 motion polish on the EarnedDashboard checkbox; Phase 1 accessibility audit (WCAG AA contrast on sky-on-cream-light); Phase 7 hand-drawn icon set replacing Lucide; Phase 5 emoji audit across `components/` + `app/` + `lib/` (not just push payloads).

## Verified
- `npx next build` not re-run — diff is bookkeeping-only (state.json + log files), no code changed.
- `git diff` confirms no `.ts` / `.tsx` changes.

## Backlog status
- Closed: none new (iter-004 ships no feature).
- Open: #20 (still blocked on Phase 4 IA decision).
- Discovered this iter: #29, #30, #31 (added to TaskList).

## Wake-up handoff
- **Current phase:** Earned transition — Phase 7 cleanup done, Phase 1 polish + Phase 5 voice migration are the natural next batches.
- **Next step:** Pick #29 (vocabulary swap pass — fully unblocked, mechanical) as iter-005's main. Optionally fat-iter with #31 (dialog copy rewrite — also voice work, disjoint files) if independence holds.
- **Files to open first:** for #29: grep `"Completed"`, `"Failed to update"`, `"Today's tasks"`, etc. across `components/`, `app/`, `lib/`. For #31: `components/ChallengeFailedDialog.tsx`, `components/ChallengeCompletedDialog.tsx`, `components/ReconciliationDialog.tsx`.
- **Open questions:** counter-habit interaction model (long-press vs swipe vs explicit +/- buttons) — needs user call before #30 can ship.
- **Carry-forward:** if #29 and #31 both land independently in iter-005 → consider a fat-iter dispatch with two Class B sub-agents on disjoint allowlists.
- **Scheduled:** 600s — impl iter, base cadence (no CR-rate-limit buffer needed since this iter shipped only one small bookkeeping PR).

## Push: ok — branch pushed when PR opened.
