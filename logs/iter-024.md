# iter-024 — Phase 2 #37 — Loader2 sweep across coach + onboarding chat surfaces

**Branch:** `earned/phase2-coach-iter024` → stacked PR (base: `earned/phase2-coach-iter022`, which now contains the squashed iter-022 + iter-023 commits since PR #74 squash-merged into it). When PR #73 finally lands on integration, both this PR's base and content auto-rebase.
**Scope:** 7 `Loader2` sites in 6 files → `<EarnedLoadingText>` (or its new `dotsOnly` mode for icon-button slots). Satisfies CLAUDE.md "no spinners" rule across all coach + onboarding-chat surfaces.

## Shipped
- **`components/earned/loading-text.tsx`** — added `dotsOnly?: boolean` prop. When true, hides the visible label and renders only the animated dots, fitting icon-only round buttons. The sr-only live region still carries the full status label.
- **`components/coach/CoachClient.tsx`** L408–413 — "Thinking…" pending indicator → `<EarnedLoadingText label="coach is thinking">` (voice-tightened from "thinking" → "coach is thinking" mid-iter per design-review #1; the user-as-protagonist rule meant a bare "thinking" was ambiguous).
- **`components/coach/CoachComposer.tsx`** L111 — send-button busy state → `<EarnedLoadingText dotsOnly label="sending">`. Lives inside the `h-9 w-9` round send button; the button still has `aria-label="Send message"` so the accessible name is preserved.
- **`components/coach/CoachPrivacySettings.tsx`** L289 — Save button spinner → `<EarnedLoadingText dotsOnly label="saving">`.
- **`components/coach/CoachPrivacySettings.tsx`** L319 — Download button spinner → `<EarnedLoadingText dotsOnly label="downloading">`.
- **`components/coach/CoachAttachmentMenu.tsx`** L168 — "Loading catalog…" inline → `<EarnedLoadingText label="loading my routines">`. Voice-tightened ("catalog" → "my routines").
- **`components/onboarding/OnboardingPersonalizeChat.tsx`** L184 — "Thinking…" pending indicator → `<EarnedLoadingText label="coach is thinking">`.
- **`components/onboarding/OnboardingReview.tsx`** L249 — "Starting…" button → `<EarnedLoadingText label="starting">`. Cleaner geometry — drops the icon-on-left + text-on-right pair for a single centered word inside the lg button (min-w-180px keeps the layout stable).

## Verified
- `npx next build` passes (19 static pages, no type errors).
- `grep "animate-spin" components app` → empty within scope. Loader2 still lives in 3 out-of-scope files (`components/DailyChecklist.tsx`, `components/ui/sonner.tsx`, `components/ui/button.tsx`) which are queued for iter-025+.
- `grep "Loader2" components/coach components/onboarding` → empty. All 6 target files have no remaining import.
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Sweep is shippable. Follow-ups (deferred unless flagged here):
  - #1 (voice) — "thinking" → "coach is thinking" — **applied mid-iter**.
  - #2 (visual QA of dotsOnly in tiny icon slots — the h-3.5 / h-4 / h-9 round button slots may read as "more options" rather than "loading") — queued for iter-025 visual QA. Mitigation: button is `disabled` while pending so the dots can't be tapped as a menu.
  - #3 (non-Earned theme coherence) — `EarnedLoadingText` always uses `var(--font-heading)`; under arctic/military/zen that renders the theme's display font, which is intentional cross-theme. Worth a doc note in `EARNED_TRANSITION.md` (deferred).
  - #4 (motion-reduce equivalence with the prior `motion-reduce:animate-none` Tailwind utility) — confirmed equivalent via internal `matchMedia`.

## Branch / merge state
- **PR #72** (iter-021): MERGED (last iter).
- **PR #73** (iter-022, now also containing squashed iter-023 due to GH stacked-PR semantics): **OPEN with `mergeable: CONFLICTING`** — conflicts on `.loop/state.json` + `logs/latest.md`. CR + Workers Build both SUCCESS. Local merge attempt blocked by classifier this turn. Needs human-tap to resolve. Until then, iter-024 stacks on top of #73's branch.
- **PR #74** (iter-023): MERGED (this iter, via stacked-PR squash that landed iter-023 commits onto iter-022's branch instead of integration).
- **iter-024 PR** (this iter): about to open with base = `earned/phase2-coach-iter022`.

## Backlog status
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #37 (coach iter-025+ continuation — Loader2 still lives in `components/DailyChecklist.tsx` + `components/ui/sonner.tsx` + `components/ui/button.tsx`; visual QA of dotsOnly in icon slots; voice copy sweep across CoachClient inline strings; backdrop-blur audit on composer pill; data-earned-send-button visual decision).

## Wake-up handoff
- **Current phase:** Earned transition — coach surface ~85% restyled. The composer pill is the next major holdout (drop-shadow + backdrop-blur reads as glass-iOS rather than paper-sticker).
- **Next step:** iter-025 picks #37 — top three candidates: (a) composer pill restyle (cream-light + ink-border + sticker shadow via `data-earned-send-button` and re-tuning the form chrome), (b) voice copy sweep across CoachClient inline strings ("Reply to the coach…" / "Ask the coach anything…" / "Ask about {routine}…" — placeholder text still says "coach"), (c) DailyChecklist + button.tsx + sonner.tsx Loader2 cleanup (out of coach scope but completes the no-spinners audit project-wide).
- **Files to open first:** `components/coach/CoachComposer.tsx` (composer pill chrome), `components/coach/CoachClient.tsx` L280-288 (placeholder strings), `components/DailyChecklist.tsx` L1005 + `components/ui/button.tsx` L81.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** PR #73 conflict (state.json + latest.md) needs human-tap. PR #74 already merged into iter-022's branch. state.json iter `23 → 24`, latest.md → iter-024.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
