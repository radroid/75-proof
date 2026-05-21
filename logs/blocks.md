# Blocks & deferred follow-ups

Append-only log of items that can't proceed without a user / external decision, plus design-review follow-ups that are non-blocking but worth tracking. Earlier iter logs cover the *what was done*; this file covers the *what's waiting*.

---

## User-decision-blocked

These items have no implementation path until someone in product / design makes a call. The autonomous loop should not invent answers for these.

### `#20` — Phase 4: Next.js redirects for renamed routes
**Source:** `docs/EARNED_TRANSITION.md` Phase 4.
**Blocker:** the Coach + Friends placement decision (Phase 4 ⛳ blocker). Options A-D in the doc; recommendation is Option C (Coach → Journal, Friends → Me) but not locked. Redirects can't be written until the new IA is known.
**Decision needed:** which of Options A/B/C/D for Coach + Friends placement.
**When unblocked:** can write the redirects in `next.config.ts` + perform folder rename `app/(dashboard)/dashboard/[old]` → `[new]` in ~1 iter.

### `#30` — Phase 1: Counter habit incremental logging in EarnedDashboard
**Source:** `docs/EARNED_TRANSITION.md` Phase 1 (line 39-42) + Open Q #2 (line 267).
**Blocker:** interaction-model choice — binary tap vs increment-by-unit vs long-press jump-to-target. Per the doc the recommended pattern is "tap = +unit, long-press = jump to target, long-press again = clear" but it's not locked.
**Decision needed:** confirm or override the recommended interaction model.
**When unblocked:** ~1 iter to replace the binary toggle on counter habits + add the increment animation.

### Phase 9 → main merge gate
**Source:** `CLAUDE.md` § "Earned transition — branch + merge rule (active)" + `docs/EARNED_TRANSITION.md` Phase 9 step 1.
**Blocker:** the rule says "do not merge to main until the transition is ready to ship to prod." The integration branch (`ux-refresh-simplified-challenge-driven`) is mature: Phase 1 polish ~done, Phase 2 surface restyle complete (incl. coach #37), Phase 5 voice migration complete, Phase 7 plumbing complete, Phase 10 docs mostly done.
**Decision needed:** is the Earned transition ready to flip the "do not merge to main" rule? If yes, we can land on main, ship to prod, then continue Phase 3 (new surfaces — Journal, Stars) + Phase 4 (nav rename, gated on the IA decision) as follow-on PRs.
**When unblocked:** ~1 iter to merge integration → main + update CLAUDE.md + update `.loop/state.json` for the new branch posture.

### Other open product questions
From `docs/EARNED_TRANSITION.md` lines 262-272:
- Journal scope (full free-write vs 1-line daily prompt).
- Tone calibration storage (account-level vs per-challenge).
- Sunset timeline for non-Earned themes (currently proposed 90 days).
- Real brand assets (designer-delivered star/logo SVGs).
- Multi-language (i18n + Caveat script coverage).

None of these need to resolve to ship the current integration branch.

---

## Design-review follow-ups (non-blocking polish)

Items flagged by the per-iter Class A reviewer that were ratified as ship-as-is but worth tracking for whenever someone touches the surface next.

### From iter-022 design-review
- `prose-chat-*` dead-code in `components/ui/chat-bubble.tsx` — **resolved iter-023**.
- DialogTitle padding under Caveat in CoachRecentsSheet — eyeball in dev; if descenders clip the `border-b` add `padding-bottom: 0.25rem` to the wrapper.
- Lucide leakage inside the recents sheet body — **resolved iter-023** (MessageSquareText/Plus/X/Trash2/Loader2 all swapped).
- Assistant-bubble assumes paper-ruled backdrop — fine inside coach but won't hold under non-paper surfaces; revisit if Earned ever embeds a chat outside the ruled paper.

### From iter-023 design-review
- EarnedLoadingText cadence (360ms ticking) is faster than star-burst-style pacing. Subjective; consider 500-600ms for a calmer pen-tap.
- EarnedLoadingText cross-theme: uses `var(--font-heading)` so on arctic/military/zen the dots render in those themes' display fonts. Feature, not bug — worth a doc note.
- NoteEarned tinted `text-primary` (sky) next to the gold "Active" chip in CoachRecentsSheet — visual call; not flagged a regression.

### From iter-024 design-review
- "thinking" voice ambiguity — **resolved iter-025/iter-026** ("coach is thinking" → "thinking", with the indicator's DOM context carrying attribution).
- Visual QA of `EarnedLoadingText dotsOnly` in tiny icon slots (h-3.5 / h-4) — dots may read as "more options" rather than "loading"; button is `disabled` while pending so the affordance is muted, but worth an eyeball in dev mode.

### From iter-025 design-review
- `bg-primary/60 text-primary-foreground` contrast on the pending send button — **resolved iter-025 mid-iter** (switched to `text-foreground` for ~7:1 ink-on-muted-sky).

### From iter-027 design-review
- **Sonner sr-only de-duplication**: when `toast.loading()` first gets called, `EarnedLoadingText`'s inner `role="status" aria-live="polite"` may stack with sonner's own toast live region. Mitigation when needed: add a `silent?: boolean` prop that suppresses the sr-only span. Zero callers today.
- **Icon-only Button loading state**: long-term, consider swap-not-append (replace children with dots) when `size` starts with `icon` so `<Button size="icon" loading>` shows just dots, not dots+glyph. Same edge case the previous Loader2 had.
- **Sonner `<span>` wrapper defensiveness**: EarnedLoadingText renders as a Fragment; a single `<span>` parent would be marginally more defensive against future sonner-internals changes.

### From iter-028 (this iter) survey
- 43 non-coach files still import Lucide (`grep "from \"lucide-react\"" components/ app/`). Most are utility / structural icons (chevrons, locks, calendars) where ThemedIcon doesn't yet have a matching variant. Adding variants for `chevron-left`, `chevron-right`, `lock`, `check`, `calendar-clock`, `refresh-ccw` (well, that's `rotate-cw`) would close the remaining gap. **Not blocking** — Lucide rendering on Earned reads as system-icon-on-paper, which is acceptable for utility chrome (vs the brand-visible Trophy/Infinity icons we just swapped).
  - `check` — **resolved iter-029** (`CheckEarned` variant + theme-switcher swap, in PR #81).
  - `calendar-clock` — **resolved iter-030** (`CalendarClockEarned` variant + ChallengeUpcoming swap).

### From iter-029 design-review
- **Extend `ThemedIcon` with optional `strokeWidth?: number` prop**, forwarded only to the Lucide branch (the Earned variants intentionally own their own stroke weight via their inline SVG). At the theme-switcher call site, the old Lucide `Check` used `strokeWidth={3}` (bold selected-tick); the swap to `ThemedIcon` silently drops that to Lucide's default `=2` on arctic / broadsheet / military / zen, losing ~0.6px of rendered stroke at 14px display. After the extension lands, restore `strokeWidth={3}` at the theme-switcher call site.
- **Visual smoke test on all four non-Earned theme cards** after the Earned merge — confirm the thinner tick (1.17px rendered) still reads clearly inside the gold disc on arctic / broadsheet / military / zen previews before Phase 9 lands on main.
