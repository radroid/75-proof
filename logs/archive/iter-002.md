# iter-002 — extract earned UI primitives

**Branch:** `earned/phase7-extract-primitives` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 1 feature (single-agent, no fat-iter — pure refactor, no behaviour change).

## Shipped
- New module `components/earned/` with four primitives:
  - `star.tsx` — `Star` (`{ size, filled }`)
  - `hand-checkbox.tsx` — `HandCheckbox` + `HandCheckboxState` (`empty | star | locked`)
  - `paper-chip.tsx` — `PaperChip` + `PaperChipTone` (`cream | gold | sky`)
  - `hand-habit-row.tsx` — `HandHabitRow` + `HabitRowData` interface
  - `index.ts` — barrel export
- `components/themes/earned-dashboard.tsx` slimmed from 819 → 585 lines: imports the primitives instead of defining them inline. Zero behavioural diff — types, props, and JSX output are byte-identical.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- `grep` confirms no stale inline `Star`/`HandCheckbox`/`HandHabitRow`/`PaperChip` references inside `earned-dashboard.tsx`.

## Why now
Phase 2 surfaces (settings, progress, onboarding) need these primitives to land Earned visuals consistently. Extracting unblocks #28's downstream consumers — every future Phase 2 PR can now `import { Star, PaperChip } from "@/components/earned"` instead of duplicating the SVG/style block.

## Backlog status
- Closed: #28 (this iter), #22 (iter-001, merged as PR #52).
- Open: #20 (route redirects — blocked on Phase 4 IA decision), #24 (design-system SKILL hoist).
- Discovered: none this iter.

## Merged this iter
- PR #52 (iter-001 offline restyle) — CR + Workers Build green, squash-merged into `ux-refresh-simplified-challenge-driven`.

## Wake-up handoff
- **Current phase:** Earned transition (mixed Phase 2 + Phase 7 cleanup).
- **Next step:** Merge iter-002's PR once CR clears, then pick #24 (design-system SKILL hoist — docs-only, low risk) since #20 is still blocked on IA.
- **Files to open first:** `design-system/project/SKILL.md`, `design-system/project/README.md`.
- **Open questions:** none — #24 is a straight conversion.
- **Carry-forward:** #20 stays blocked until Phase 4 IA decision is made.
- **Scheduled:** 900s — impl iter, base cadence.

## Push: ok (branch pushed when PR opened).
