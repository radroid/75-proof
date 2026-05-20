# iter-026 — Phase 2 #37 — coach voice sweep + DailyChecklist Loader2 cleanup

**Branch:** `earned/phase2-coach-iter026` → PR base `ux-refresh-simplified-challenge-driven` (PR #77 merged at top of turn, integration clean, no stacking).
**Scope:** three coach-as-other voice sites + one DailyChecklist Loader2 site. Marketing landing + OG image audited and found clean (no copy edits).

## Shipped
- **`components/coach/CoachClient.tsx`** L410 — `<EarnedLoadingText label="coach is thinking">` → `label="thinking"`. The indicator renders inline between the user's bubble (L406) and the streaming assistant bubble (L418-422); DOM context makes attribution self-evident, so "coach is" was redundant.
- **`components/coach/CoachEmptyState.tsx`** L57-65 — replaced the "Hi, I'm your coach. / I help you reach your goals…" persona intro with **"What would you like to figure out today? / Pick a prompt below, or write your own."** Drops the coach-as-other framing and centers the user's intent. Class A reviewer's verdict: the previous version foregrounded the coach (violating user-as-protagonist); a literal first-person "What do I want to figure out today?" would read as inner monologue rather than an inviting prompt. The current "What would you like…" lands as the correct middle path — addresses the user without making the coach the protagonist.
- **`components/coach/CoachPrivacySettings.tsx`** L303-306 — "Chat with the coach to start your bio…" → "Chat to start your bio…". Drops "with the coach" — the surface IS the coach.
- **`components/DailyChecklist.tsx`** L22 + L1003-1013 — replaced `Loader2` + "Uploading…" with `<EarnedLoadingText label="uploading">`. `Loader2` import removed (other 7 Lucide icons in the import line retained — all still load-bearing). Out-of-scope-for-coach but advances the project-wide "no spinners" audit. `<label>` tap geometry unaffected (its own padding/border class stack carries the touch target).

## Audited, not modified
- `app/opengraph-image.tsx` — brand tagline "Show up. Every day. Earn the star." No coach references.
- `app/page.tsx` (marketing landing) — tagline "Show up. Every day. Build the streak." No coach references.
- Tagline drift between OG ("Earn the star") and landing ("Build the streak") flagged for a future iter — both are brand surfaces and should match.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** All 4 swaps clean. EmptyState heading choice ratified as the correct middle path (literal first-person would read as inner monologue). DOM-context check on "thinking" passes. DailyChecklist `<label>` tap geometry intact (Camera icon still load-bearing at the non-uploading branch). Follow-ups deferred to iter-027+:
  - OG vs landing tagline drift — both brand surfaces should unify ("Earn the star" likely wins as the more product-specific phrasing).
  - `CoachClient.tsx:85` code comment "the coach owns its own scrolling region" — internal doc, not user-facing; normalize on a future sweep.
  - DailyChecklist visual eyeball — confirm `EarnedLoadingText` centers inside the `<label>`'s implicit flex (single text node; should inherit centering from the label's existing class stack but worth a dev-mode check).
  - CoachPrivacySettings "Chat to start your bio" — slightly terse; consider "Start a chat to begin your bio" if user-testing flags ambiguity.

## Branch / merge state
- PR #72, #73, #74, #76, #77 all MERGED (the full cascade is now on integration).
- PR #75 closed (rescued as #76).
- PR #78 (this iter): about to open with base = integration. No stacking required.

## Backlog status
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #37 (coach iter-027+ continuation — button.tsx + sonner.tsx Loader2 cleanup is the last big project-wide infra change; tagline unification on landing/OG; any final polish on coach surface).

## Wake-up handoff
- **Current phase:** Earned transition — coach surface fully restyled at copy + visual level. Final infra cleanup (button.tsx + sonner.tsx) is the only remaining "no spinners" work.
- **Next step:** iter-027 picks #37 — top three candidates: (a) **`components/ui/button.tsx` Loader2 cleanup** — the Button component's loading state at L81 uses Loader2. This is shared infra (used by every primary button in the app) so the change needs a careful audit of how `loading` prop callers expect the indicator to render. Check sizing — the current Loader2 is h-4 w-4 inline. EarnedLoadingText with `dotsOnly` should fit. (b) **`components/ui/sonner.tsx` Loader2 cleanup** — toast loading icon at L22. Replace with EarnedLoadingText dotsOnly. Sonner toast loading state is rarely seen; lowest blast radius. (c) **Brand tagline unification** — pick one of "Earn the star" / "Build the streak" and apply to both `app/opengraph-image.tsx` and `app/page.tsx`. Recommend "Earn the star" as more product-specific.
- **Files to open first:** `components/ui/button.tsx` L1-95 (small file), `components/ui/sonner.tsx` L1-50 (small file), `app/opengraph-image.tsx` L99 + `app/page.tsx` L94.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** none — clean PR cascade. state.json iter `25 → 26`, latest.md → iter-026.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
