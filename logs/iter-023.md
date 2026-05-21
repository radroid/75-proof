# iter-023 — Phase 2 coach surface (#37) — sheet icon swap + loading pattern + dead-code prune

**Branch:** `earned/phase2-coach-iter023` → stacked PR (base: `earned/phase2-coach-iter022`, which is the iter-022 PR #73 still in CR review). When #73 merges, this PR's base auto-rebases to `ux-refresh-simplified-challenge-driven`.
**Scope:** four sub-items: ThemedIcon swap in CoachRecentsSheet, EarnedLoadingText primitive, page-header decision (chromeless ratified — no code change), dead-code prune.

## Shipped
- **`components/earned/icons/note.tsx`** (NEW). Hand-drawn folded-corner page with three written lines (1.7px ink, `rotate(-1.5deg)`, round caps). Replaces Lucide `MessageSquareText` under Earned for individual thread rows. Registered as `note` variant in ThemedIcon.
- **`components/earned/loading-text.tsx`** (NEW). `EarnedLoadingText` — handwritten word + animated 1→2→3-dot ellipsis at 360ms; `prefers-reduced-motion: reduce` → static 3-dot. Uses `var(--font-heading)` so Earned renders Caveat. Accessibility: visible span is `aria-hidden`, a sibling `<span class="sr-only" role="status" aria-live="polite">` carries the static label "{label}, please wait" so screen readers announce only once on mount instead of re-announcing every tick. Replaces 2 `Loader2` usages in CoachRecentsSheet (loading sheet contents + delete-confirm spinner).
- **`components/earned/icons/themed-icon.tsx`** + **`index.ts`** + **`components/earned/index.ts`** — wired `note` variant + `EarnedLoadingText` export.
- **`components/coach/CoachRecentsSheet.tsx`** — replaced `Plus` / `X` / `MessageSquareText` (×2) / `Trash2` with `<ThemedIcon name="…">` swaps; replaced both `Loader2` sites with `<EarnedLoadingText label="loading my pages">` (sheet load) and `<EarnedLoadingText label="tearing out">` (delete-confirm). All 5 Lucide imports removed.
- **`components/ui/chat-bubble.tsx`** — stripped dead `prose-chat` / `prose-chat-user` / `prose-chat-assistant` classes from the MarkdownInline wrapper div (zero CSS rules existed for any of them; pre-existing dead code flagged by iter-022 design-review). `isUser` prop remains load-bearing inside markdown component overrides.
- **`components/coach/CoachThreadList.tsx`** — DELETED. Confirmed dead code via repo-wide grep (only refs were the file itself + iter-005 log + iter-022 handoff). Never imported by any route or page.
- **Page-header decision** (no code change). `/dashboard/coach` stays chromeless — the transcript is the protagonist and the floating recents button (already restyled) is sufficient chrome. Ratifies iter-022's prediction.

## Verified
- `npx next build` passes (19 static pages, no type errors).
- **Class A design-review verdict: APPROVE_WITH_FOLLOWUPS.** Spec compliance clean on all 4 items; `CoachThreadList.tsx` delete confirmed safe (zero inbound code refs); `prose-chat-*` strip clean (`isUser` still load-bearing inside markdown overrides); NoteEarned stroke/rotation matches peer icons (HistoryEarned, PaperAirplaneEarned); `EarnedLoadingText` `prefers-reduced-motion` listener correct; chromeless page-header decision reasonable. Reviewer's primary follow-up (#1 — aria-live announce-spam risk) was **applied mid-iter** as a defensive sr-only / aria-hidden split. Remaining follow-ups deferred to iter-024+: (2) 360ms cadence may be slightly fast vs star-burst pacing — subjective; (3) `EarnedLoadingText` cross-theme behaviour (var(--font-heading) under arctic/military/zen renders the heading font of those themes, which is a feature not a bug but worth a doc note); (4) NoteEarned text-primary tint sits next to the gold "Active" chip in the active-thread row — eyeball on cream paper, design call; (5) all hover/focus colour utilities verified to propagate through ThemedIcon via currentColor.

## Carried from earlier iters
- PR #72 (iter-021, error/fallback pages) **MERGED THIS ITER**. Classifier permitted the merge once `gh pr merge 72 --squash --delete-branch` was retried at the top of this turn. CR + Workers Build had both been SUCCESS since iter-021 close.
- PR #73 (iter-022, coach bubble + history icon + recents sheet pass) **still OPEN**. CR + Workers Build SUCCESS, but merge blocked by classifier ("review hasn't had time to complete"). iter-023 is stacked on top of #73; when #73 merges, GH auto-rebases #74 (this iter's PR) onto integration.

## Backlog status
- Open: #20 (Phase 4 IA blocker), #30 (counter habit — user call), #37 (coach iter-024+ continuation — Loader2 swap in CoachClient.tsx + CoachComposer.tsx + CoachPrivacySettings.tsx + CoachAttachmentMenu.tsx + onboarding chat surfaces; narrow-mobile shadow QA on bubbles; focus-ring scope rework; voice copy sweep on CoachClient inline strings).

## Wake-up handoff
- **Current phase:** Earned transition — coach surface ~70% restyled. Sheet, bubble, history icon, note icon, loading pattern done; the remaining Loader2 sites (CoachClient L410, CoachComposer L112, plus 5 elsewhere) + the empty-state composer + onboarding chat surfaces still hold spinners.
- **Next step:** iter-024 picks #37 — top three candidates: (a) Loader2 → EarnedLoadingText sweep across CoachClient + CoachComposer + CoachPrivacySettings + CoachAttachmentMenu, (b) Onboarding chat surfaces (OnboardingPersonalizeChat + OnboardingReview) — same recipe; pulls Onboarding closer to Earned, (c) CoachComposer attach-menu + send-button visual pass (the pill is currently chip-like; ink-border + sticker shadow may help).
- **Files to open first:** `components/coach/CoachClient.tsx` L410, `components/coach/CoachComposer.tsx`, `components/coach/CoachPrivacySettings.tsx`, `components/coach/CoachAttachmentMenu.tsx`.
- **Open questions:** counter habit interaction model (#30) — still parked.
- **Carry-forward:** PR #73 needs human-tap merge (classifier blocks agent). state.json iter `22 → 23`, latest.md → iter-023.md.
- **Scheduled:** 900s — impl iter + design-review buffer.

## Push: ok — branch pushed when PR opened.
