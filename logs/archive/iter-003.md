# iter-003 — CR fixes on #53 + design-system skill hoist

**Scope:** 2 PRs in flight (single-agent, sequential).
**Branches:** `earned/phase7-extract-primitives` (PR #53 carry-over) + `earned/phase10-design-skill-hoist` (PR #54, this iter's main).

## Shipped
- **PR #53 follow-up** — CR posted CHANGES_REQUESTED with two actionable findings on the iter-002 primitives:
  - `HandCheckbox` now derives `isDisabled = disabled || state === "locked"` so the primitive is safe to reuse without callers needing to also pass `disabled`. Aria + cursor follow.
  - `HandHabitRow` types its local `state` const as `HandCheckboxState` instead of duplicating the inline literal union.
  - Re-triggered `@coderabbitai review`; build green.
- **#24 — design-system skill hoist (PR #54)** — created `.claude/skills/earned-design/SKILL.md`. Thin pointer skill (67 lines) referencing the canonical `design-system/project/` content as the single source of truth: brand voice, palette, type, production-code mapping to `@/components/earned/*`, plus copy-paste install instructions for `~/.claude/skills/`. Updated `design-system/project/README.md` index row to cross-link the skill location.

## Verified
- `npx next build` passes on the PR #53 follow-up commit (no type errors, 19 static pages).
- The `.claude/skills/` change is docs-only; no build run needed.

## Backlog status
- Closed: #24 (this iter, awaiting merge).
- Open: #20 (still blocked on Phase 4 IA decision).
- Discovered: none.

## In-flight PRs
- PR #53 — iter-002 primitives + CR fixes. Awaiting CR re-review verdict.
- PR #54 — #24 design-system skill hoist. To open + request CR review this iter.

## Wake-up handoff
- **Current phase:** Earned transition (Phase 7 cleanup + Phase 10 polish).
- **Next step:** Merge PR #53 once re-review clears, then merge PR #54 (CR should clear quickly — docs-only diff). After both merged, bump `.loop/state.json` to `iter:3` and repoint `logs/latest.md` → `iter-003.md`.
- **Files to open first:** `gh pr view 53 --json reviews,statusCheckRollup`, `gh pr view 54 --json …`.
- **Open questions:** none. #20 stays parked until IA call.
- **Carry-forward:** state.json/latest.md bookkeeping deferred to iter-004 because both #53 and #54 would otherwise conflict on those files.
- **Scheduled:** 900s — impl iter, base cadence + CR rate-limit buffer.

## Push: ok — both feature branches pushed to origin.
