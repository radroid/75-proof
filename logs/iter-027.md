# iter-027 — Phase 2 #37 — project-wide no-spinners audit + tagline unification

**Branch:** `earned/phase2-coach-iter027` → PR base `ux-refresh-simplified-challenge-driven`. Single PR, no stacking.
**Scope:** finish the project-wide "no spinners" audit by touching the last two shared-infra files (button.tsx + sonner.tsx) + unify the brand tagline between OG and landing.

## Shipped
- **`components/ui/button.tsx`** L4 + L80-92 — replaced Lucide `Loader2` import with `EarnedLoadingText`. Button's `loading` branch now renders `<EarnedLoadingText dotsOnly label="loading" />` followed by `children`. Children-after-indicator pattern preserved. Added a comment explaining the icon-only-variant edge case (dots-next-to-glyph) — same UX edge case the previous Loader2 had. **3 caller sites audited**: `StartChallengeModal.tsx:185`, `DailyChecklist.tsx:844`, `settings/page.tsx:1051`. All pass labeled children (not icon-only), so dots + label reads naturally.
- **`components/ui/sonner.tsx`** L3-10 + L22 — replaced Lucide `Loader2Icon` import with `EarnedLoadingText`. Sonner's `icons.loading` config now passes `<EarnedLoadingText dotsOnly label="loading" />` to the toast icon slot. **Zero current callers of `toast.loading()`** — this is a defensive/forward-looking change; live UX impact is nil.
- **`app/page.tsx`** L94 — landing tagline "Show up. Every day. Build the streak." → "Show up. Every day. Earn the star." Now matches `app/opengraph-image.tsx` L99. "The star" is product-specific (vs the generic "streak") and the landing already shows a gold star above the headline so first-time-visitor context holds.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- `grep "animate-spin|Loader2" components app` → ZERO live references in src. Two remaining hits are comment-only (`loading-text.tsx:7` and `button.tsx:87` both reference the old Loader2 they replaced). **Project-wide no-spinners audit complete.**
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** All 3 swaps clean. Button geometry verified (gap-2 + text-sm dots reads as rhythm; CVA's `[&_svg:not([class*='size-'])]:size-4` doesn't apply since dots aren't SVG). Sonner sr-only nested-aria-live concern flagged as latent (zero callers today). Icon-only Button loading state continues the same edge case as Loader2. Tagline unification verified at both surfaces.
- Reviewer's optional follow-ups (deferred):
  - **Sonner sr-only de-duplication**: when `toast.loading()` first gets called, EarnedLoadingText's inner `role="status" aria-live="polite"` may stack with sonner's own toast live region. Mitigation when needed: add a `silent?: boolean` prop to EarnedLoadingText that suppresses the sr-only span.
  - **Icon-only Button loading**: long-term, consider swap-not-append (replace children with dots) when `size` starts with `icon` so `<Button size="icon" loading>` shows just dots, not dots+glyph.
  - **Sonner span wrapper**: a single `<span>` parent around EarnedLoadingText would be marginally more defensive against future sonner-internals changes — currently fine as fragment.

## Branch / merge state
- PR #72, #73, #74, #76, #77, #78 all MERGED — full coach restyle cascade now on integration.
- PR #75 closed (was rescued as #76 earlier).
- PR #79 (this iter): about to open with base = integration. No stacking required.

## Backlog status — #37 CLOSING
This iter delivers the final coach + project-wide spinner work. **#37 (Phase 2: /dashboard/coach iter-021+ continuation) is now COMPLETE** as of this PR's merge. Coverage:
- iter-021 (#36): error/fallback pages
- iter-022: chat bubble role styling + history icon + recents sheet pass
- iter-023: sheet icon swap + EarnedLoadingText primitive + dead-code prune
- iter-024: 7-site Loader2 sweep across coach + onboarding chat
- iter-025: composer glass→paper + placeholder voice
- iter-026: coach-as-other voice sweep + DailyChecklist Loader2
- iter-027: button.tsx + sonner.tsx + tagline unification (this iter)

Marking task #37 completed in the project task list.

Open backlog after this iter:
- **#20** (Phase 4 IA — Next.js redirects for renamed routes): user-decision-blocked. Needs the Coach + Friends placement IA decision before redirects can land.
- **#30** (Phase 1 counter habit incremental logging): user-decision-blocked. Needs the interaction-model choice (long-press / swipe / explicit +/-).

## Wake-up handoff
- **Current phase:** Earned transition — coach Phase 2 work fully complete. Remaining open items (#20, #30) are both user-decision-blocked.
- **Next step (iter-028):** with both open backlog items blocked, the loop should pick up Phase 9 rollout prerequisites instead: a) review `docs/EARNED_TRANSITION.md` to find the Phase 9 pre-flight checklist, b) audit any remaining theme-leak risks (Lucide imports still active in non-coach surfaces that should swap to ThemedIcon), c) sanity-check that the merge rule `do not merge to main` is still active in CLAUDE.md (it is) and confirm the rollout gate criteria for flipping it. If those are also blocked or unclear, log to `logs/blocks.md` and schedule a longer-cadence wake-up (1500s+) since impl work has dried up pending user decisions.
- **Files to open first:** `docs/EARNED_TRANSITION.md`, `CLAUDE.md` § "Earned transition — branch + merge rule (active)", `logs/blocks.md` (create if missing).
- **Open questions:** counter habit interaction model (#30); Coach + Friends IA decision (#20). Both for user.
- **Carry-forward:** none. state.json iter `26 → 27`, latest.md → iter-027.md.
- **Scheduled:** 1500s — implementation work is drying up; longer cadence reflects the natural pause while pending user decisions.

## Push: ok — branch pushed when PR opened.
