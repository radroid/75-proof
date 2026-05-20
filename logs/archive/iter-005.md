# iter-005 — Phase 5 voice migration: vocab swap + dialog rewrites

**Branch:** `earned/phase5-vocab-swap` → PR into `ux-refresh-simplified-challenge-driven`
**Scope:** 2 features (single-branch — disjoint enough to share a PR; vocab sweep touches different lines than dialog rewrites).

## Shipped this iter
- **#29 — vocabulary swap pass** (Phase 5)
  - `app/(dashboard)/dashboard/progress/page.tsx` — "Completed at" → "Showed up at"; "Completed"/"Not done" status labels → "Showed up"/"Skipped".
  - `components/progress/calendar-grid.tsx` — legend label "Completed" → "Showed up".
  - `lib/local-store/mutations.ts` — 3 activity-feed messages: `"Completed Day N!"` → `"Day N — showed up."`, "Completed the M-day challenge!" → "Showed up for all M days." Removed trailing exclamation per Earned voice rule.
  - `components/coach/CoachPrivacySettings.tsx` — 4 toast.error strings: "Failed to update/clear/save bio" → "That didn't save / Couldn't clear / Couldn't save bio — try again?".
  - `components/coach/CoachRecentsSheet.tsx`, `components/coach/CoachThreadList.tsx` — toast "Failed to delete" → "Couldn't delete — try again?".
  - `app/api/coach/export/route.ts` — API error: "Failed to build export bundle" → "Couldn't build the export bundle — try again?".
  - Skipped: onboarding `Goals` step indicator + `OnboardingGoals.tsx` — deeper UX concept than a one-word swap; leaving for a dedicated onboarding-restyle pass (Phase 2).
- **#31 — dialog copy rewrite** (Phase 5)
  - `ChallengeFailedDialog`: title "A fresh start" → "Today's a fresh page"; body trimmed "per 75 HARD rules" boilerplate; second paragraph now first-person ("I made it ... I can do it again, stronger."); CTA "Start New Challenge" → "Start a new one" (sentence case + first-person tone).
  - `ChallengeCompletedDialog`: title "You did it." → "I did it."; description "You finished your X-day..." → "I finished my X-day...".
  - `ReconciliationDialog`: description "Confirm you finished them in real life" → "Confirm I finished them"; buttons "I completed the HARD tasks" / "+ soft tasks" → "I showed up for the HARD habits" / "+ soft habits" (vocab swap + voice rewrite combined).

## Verified
- `npx next build` passes (19 static pages, no type errors).
- No emoji introduced. No exclamation marks left in user-facing strings I touched.
- "you/your" → "I/my/me" applied only where it lands naturally — neutral phrasings like "No habits configured" left alone.

## Backlog status
- Closed: #29, #31 (this iter).
- Open: #20 (Phase 4 IA blocker), #30 (counter habit incremental — needs user decision on interaction model).
- Discovered: onboarding "Goals" step label conceptually conflicts with the design's "Habit" vocabulary; deferred since changing it requires renaming the OnboardingGoals component + its route + tour copy.

## Merged earlier in iter
- PR #55 (iter-004 bookkeeping) — merged at start of this iter.

## Wake-up handoff
- **Current phase:** Earned transition — Phase 5 (voice) mostly closed; Phase 2 (surface restyle) is the natural next batch.
- **Next step:** Pick from Phase 2 surface restyle backlog — `/dashboard/settings` (M, "My notebook" feel) is small enough for a single-iter ship and uses the extracted `components/earned/` primitives. Larger surfaces (`/progress`, `/coach`, `/onboarding`) are L-sized so save them for later.
- **Files to open first:** `app/(dashboard)/dashboard/settings/page.tsx`, `design-system/project/ui_kits/earned-ios/screens.jsx` (the `MeScreen` reference).
- **Open questions:** counter habit interaction model (#30) — still needs user call.
- **Carry-forward:** if next iter picks settings restyle, follow the "Frontend has no free signal" rule — chrome-MCP screenshot + design-review sub-agent before commit.
- **Scheduled:** 600s — impl iter, base cadence.

## Push: ok — branch pushed when PR opened.
