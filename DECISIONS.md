# Local Mode — Decision Log

Branch: `feat/local-storage-mode`. PR review reference doc.

## Goal
Allow privacy-conscious users to track their habits without signing in. Data lives in `localStorage` only — never sent to Convex/Clerk. UX should mirror the signed-in experience minus the social bits (no friends nav). A pared-down local settings surface ships with this PR (see decision #7) so users can rename themselves, manage challenge length, and erase data without an account.

---

## Architectural decisions

### 1. Single localStorage document, versioned
**Decision:** All "tables" stored as one JSON blob under key `75proof:local:v1`.
**Why:** Atomic reads/writes, no cross-key consistency bugs, simpler migration. Total size is tiny (a year of habit entries < 100 KB).
**Trade-off:** Re-serializes everything on every mutation. Negligible at this scale; revisit if a user reaches 1000+ days.

### 2. String IDs prefixed `local_*`
**Decision:** Local IDs are `local_<table>_<base36-timestamp>_<base36-random>` strings, never the Convex branded `Id<...>` type. (We considered a per-table counter and dropped it — a timestamp + random suffix avoids carrying counter state across reloads and makes IDs unique even after a reset/re-onboard within the same millisecond.)
**Why:** Eliminates risk of accidentally sending a local ID to Convex. Components consume `_id` as `string`/`any` everywhere already.
**Trade-off:** TypeScript can't statically prove "this branch never calls Convex" — relies on runtime `isLocal` gate (a `local_` prefix check).

### 3. Reactive store via `useSyncExternalStore`
**Decision:** Single in-memory cache + listener set; React subscribes via `useSyncExternalStore`.
**Why:** Standard React pattern, no external dep. Each mutation calls `notify()` after persist; consumers re-render.
**Trade-off:** All subscribers re-evaluate selectors on every change — fine here because the store is small.

### 4. Reuse existing `isGuest` branch points; rename semantics
**Decision:** The codebase already has `useGuest()` + `isGuest` plumbed throughout themed dashboards. Keep the surface, change the meaning: `isGuest === true` now means "running in local-only mode with persisted CRUD data," not "read-only demo data."
**Why:** Minimizes diff. The marketing demo was for showcasing the dashboard to logged-out visitors; we get the same effect with real local data and onboarding.
**Trade-off:** Removes the read-only "preview without committing" demo. Users who hit `/dashboard` signed-out get redirected to `/onboarding` to actually pick habits. That's a stronger signal of intent — and the landing page still describes the app at length before any flow.

### 5. Drop legacy `dailyLogs` system in local mode
**Decision:** Local-mode challenges always use the `habitDefinitions` + `habitEntries` model. No legacy 8-task `dailyLogs` rows.
**Why:** Onboarding creates habit definitions for every new user. Legacy is only for pre-onboarding-rewrite Convex users. Local mode has no such legacy.
**Trade-off:** Two-system code paths in shared components (themed dashboards) still need to handle legacy for Convex users; local mode just always picks the "new system" branch.

### 6. No web push in local mode — `Notification` API only
**Decision:** Local users get an in-page "Enable reminders" prompt that calls `Notification.requestPermission()`. We do NOT register a service-worker push subscription (which would require a server endpoint to deliver to). v1 stores reminder time in `localStorage` and shows a confirmation toast — actual scheduled delivery is out of scope.
**Why:** Web push without a backend = self-defeating. Anything we'd schedule needs the page open. The user explicitly asked for "ask for notification permissions" — granting permission and storing the preference is achievable; remote delivery isn't, and it would require sending data to a server (defeating privacy).
**Trade-off:** Local users don't get morning/evening reminders pushed when the app is closed. Acknowledged in the prompt copy.

### 7. No friends and no reconciliation/auto-fail in local mode; settings page is local-only
**Decision:** Friends nav is omitted from sidebar/mobile nav for local users. A dedicated **local settings page** is included (`components/local-settings.tsx`) — it exposes only the controls that are meaningful without an account or server: theme, display name, water unit, haptics toggle, browser-notification permission, challenge-length controls (extend / convert to habit tracker), reset paths, and an "erase all local data" affordance. Friend-sharing prefs and the Web Push device list are intentionally absent. Reconciliation (which fails challenges after 7 days of missed completions) does not run in local mode for v1.
**Why:** Friends remain out of scope per the user. The settings surface ended up necessary because basic affordances like "rename me", "reset progress", and "wipe my data" had nowhere else to live. Reconciliation is a heavy auto-failure path; running it in local mode without an obvious "recover" UI feels punishing for a privacy mode that has no support channel. v1 advances `currentDay` based on calendar but doesn't auto-fail.
**Trade-off:** A local user who walks away for 30 days returns to a high `currentDay` with many empty days behind them. They can still mark complete via the day navigator on past days (via the "isDayEditable" relaxation for local mode — see #8).

### 8. Editing past days is allowed in local mode
**Decision:** `isDayEditable` returns `true` for any past day in local mode (not just today).
**Why:** Without reconciliation, users need *some* way to fill in yesterday or two days ago. Locking past days would orphan completions.
**Trade-off:** Diverges from signed-in behavior. Acceptable — local mode is explicitly a different product surface.

### 9. PWA install prompt: enabled for local users with onboarding done
**Decision:** Install prompt gate flips to "isSignedIn OR isLocal+onboarded".
**Why:** User explicitly asked for this. The install logic itself is auth-agnostic; only the gate was Convex-coupled.

### 10. Onboarding flow: bypass auth check, write to local store
**Decision:** When unauthenticated, the onboarding page does NOT redirect to `/sign-in`. Instead it submits via the local store. The "completeOnboarding" mutation is replaced with a local-store function that creates the challenge + habit definitions + sets `onboardingComplete: true`.
**Why:** Required for the local flow to work end-to-end.

### 11. Landing page: add "Track Locally" CTA next to sign-up
**Decision:** Add a button on `/` that initializes local mode and routes to `/onboarding`.
**Why:** Discoverability for the privacy path. Existing "Try the App" link sent users to a read-only demo; we're upgrading that to the real flow.

---

## What we explicitly do NOT do (v1)

- No data migration between local mode and signed-in mode. If a user later signs up, they start fresh on Convex; no import. (Future enhancement.)
- No multi-device sync (it's localStorage by definition).
- No web push notifications in local mode (see #6).
- No friend feeds, leaderboards, nudges, reactions in local mode.
- No connected devices (Apple Health, Oura, Whoop) in local mode.
- No progress photos in local mode (would require base64-encoding into localStorage, blowing the quota).
- No reconciliation / auto-fail (see #7).

---

## Edge cases and how we handle them

| Case | Behavior |
| --- | --- |
| User opens app on incognito (no localStorage) | Landing page renders. "Track Locally" still works for that session; data lost on close. We do not warn — the next visit just looks like a brand new local user. |
| `localStorage` is full / write throws | Mutation logs an error to console; the in-memory cache is rolled back to last-persisted state. Toast shown. |
| User signs in after using local mode | Local data remains in localStorage but is invisible while signed in. We surface a one-time "Use local data?" notice in v2. v1: show nothing — Convex user sees a fresh signed-in state. |
| User clears site data | Local data lost. There is no recovery — we are explicit in the install/notification prompts about the no-cloud guarantee. |
| Date crosses midnight while app is open | `currentDay` advances on next render via `useChallengeStatus` (local variant). |
| User picks a startDate in the future | `currentDay = 1` until the date arrives, just like Convex. |

---

## File map (target)

```text
lib/local-store/
  db.ts             # types
  store.ts          # singleton, useSyncExternalStore-friendly
  mutations.ts      # createChallenge, toggleHabit, etc.
  queries.ts        # selectors
  hooks.ts          # useLocalDB, useLocalChallenge, useLocalHabitDefs, etc.
  notifications.ts  # Notification API helpers
components/
  guest-provider.tsx                # repurposed for local mode
  GuestDailyChecklist.tsx           # retained for potential marketing/demo use; currently unused in production code paths
  themes/*-dashboard.tsx            # branch on isLocal where it currently branched on isGuest
  pwa/install-prompt-gate.tsx       # gate fix
  pwa/notification-prompt-gate.tsx  # local-mode variant
app/(onboarding)/onboarding/page.tsx # support unauthenticated flow
app/(dashboard)/layout.tsx           # already mostly handles guest; double-check
app/(dashboard)/dashboard/page.tsx   # local-data branch
app/(dashboard)/dashboard/progress/page.tsx # local-data branch
app/page.tsx                         # add "Track Locally" CTA
```

---

## Implementation summary (post-build)

### Files added
- `lib/local-store/db.ts` — typed shape of the persisted blob.
- `lib/local-store/store.ts` — singleton with subscribe/notify, SSR-safe snapshot, cross-tab `storage` event listener for multi-tab consistency.
- `lib/local-store/queries.ts` — pure selectors mirroring Convex query handlers.
- `lib/local-store/mutations.ts` — `completeOnboarding`, `toggleTaskEntry`, `updateCounterEntry`, `markDayComplete`, `syncChallengeStatus`, `updatePreferences`, `setNotificationsGranted`, `markTutorialSeen`.
- `lib/local-store/hooks.ts` — React hooks built on `useSyncExternalStore`.
- `lib/local-store/notifications.ts` — `Notification.requestPermission()` wrapper, persists grant state.
- `components/pwa/local-notification-prompt.tsx` — local-mode notification card.

### Files modified
- `components/guest-provider.tsx` — semantics flipped from read-only demo to live local CRUD; opt-in flag in localStorage.
- `app/page.tsx` — added "Track Locally" CTAs (hero + final).
- `app/(dashboard)/layout.tsx` — anonymous-without-opt-in redirects off the dashboard; `FriendsNavIcon` no longer eagerly rendered for guests.
- `app/(dashboard)/dashboard/page.tsx` — guest path renders themed dashboard from local store; redirects to onboarding if no local challenge.
- `app/(dashboard)/dashboard/progress/page.tsx` — sourced active-challenge data from the local store when isGuest; multi-challenge history selector hidden for local mode v1.
- `app/(onboarding)/onboarding/page.tsx` — accepts unauth users when local-opted-in; submits via `localCompleteOnboarding`.
- `components/themes/{arctic,zen,military,broadsheet}-dashboard.tsx` — polymorphic data sourcing; local always treated as new (habit-defs) system; local users can edit any past day; `ChallengeCompletedDialog` gated to signed-in users (its CTAs are Convex-only).
- `components/DynamicDailyChecklist.tsx` — `markDayComplete` routes to local mutation when isGuest.
- `hooks/use-habit-entries.ts` — polymorphic Convex/local read+write.
- `hooks/use-challenge-status.ts` — local variant runs `syncChallengeStatus` on mount; never reports `failed` or `needs_reconciliation`.
- `components/pwa/install-prompt-gate.tsx` — gates on local user OR signed-in user.
- `components/pwa/notification-prompt-gate.tsx` — local users see the local-only notification prompt.
- `components/guest-signup-banner.tsx` — copy updated to "Local mode. Data stays on this device."

## Known v1 gaps (deferred)

- Multi-challenge history selector in `/dashboard/progress` is hidden for local mode.
- ChallengeCompleted dialog is suppressed for local users (the dialog's CTAs are Convex-only). The dashboard still shows `currentDay = daysTotal` with a sync stop, just no celebration modal. Future: build a local-aware completion dialog.
- No reconciliation/auto-fail in local mode. Local users editing past days bypass the strict 7-day window.
- No data migration from local → Convex on sign-up. The local data persists in storage but is invisible to the signed-in flow.
- No progress photos in local mode.
- Notifications: permission is captured + recorded, but no scheduled delivery (no service-worker push from a server).

## Adversarial review pass — findings + resolutions

Two parallel adversarial agent reviews ran against the plan and the implementation. Highest-impact issues (BLOCKING in agent #2's report) were addressed in-branch:

| # | Finding | Resolution |
| --- | --- | --- |
| 1 | `isLocalOptedIn` read non-reactively from `localStorage` during render → SSR/hydration mismatch and stale `isGuest` after `enterLocalMode` | `useState(false)` initialized in `useEffect`; setter flipped from `enterLocalMode`/`resetLocal`/sign-in handlers (`components/guest-provider.tsx`). |
| 7 | `router.replace("/sign-in")` called from render in onboarding | Moved to `useEffect`; render returns null while redirect is in flight (`app/(onboarding)/onboarding/page.tsx`). |
| 15 | `setSelectedChallengeId` called from render in progress page | Moved into `useEffect` keyed on `effectiveHistoryId` (`app/(dashboard)/dashboard/progress/page.tsx`). |
| 11 | `useChallengeStatus` first-mount ref never reset across challenge changes | Replaced `hasChecked` boolean ref with `lastCheckedRef` keyed on the challenge id (`hooks/use-challenge-status.ts`). |
| 12 | Local status synthesized as `"active"` while the local store was still hydrating | Returns `null` until `localChallenge` resolves (`hooks/use-challenge-status.ts`). |
| 6 | `markTutorialSeen` / `setNotificationsGranted` would auto-create a half-populated user before onboarding, flipping `useHasLocalData()` | Both bail on `!draft.user`; `updatePreferences` now does the same (`lib/local-store/mutations.ts`). |
| 2 | Sign-in cleared the localStorage flag but left the in-memory copy stale | `setOptInPersisted(false)` accompanies the localStorage clear in the auth-state effect (`components/guest-provider.tsx`). |

Lower-priority findings (NICE-TO-HAVE) were noted but not addressed in this PR:
- Storage-event listener registered in `hydrate()` is never removed; benign in production, leaks on dev HMR.
- `nextId` field on `LocalDB` is unused; ID generation lives in `mutations.ts` (`genId`). The dead `localStore.nextIdFor` method was removed; the field is left on the schema for now to avoid a `version` bump.
- `syncChallengeStatus` doesn't dedupe its `challenge_completed` feed insert; a second call would early-return on `challenge.status !== "active"`, so the existing ordering protects against duplicates.

## Review/test checklist

- [x] `npx next build` passes
- [ ] Sign-in flow unaffected (existing Convex users see no change)
- [ ] Sign out + visit `/` → can see "Track Locally" CTA
- [ ] Sign out + visit `/dashboard` → redirects to `/onboarding` if no local challenge, else renders dashboard
- [ ] Onboarding submits, lands on `/dashboard` with day 1
- [ ] Toggle a habit → entry persists across reload
- [ ] Counter habit increment/decrement persists
- [ ] Day navigator: tap past day, mark complete, persists
- [ ] Progress page: stats + calendar + day-by-day history all populated
- [ ] Friends nav not visible in sidebar/mobile
- [ ] Settings link visible (local-mode surface — see decision #7) and routes to the local-only settings page
- [ ] PWA install prompt appears (on supported platforms) after second dashboard visit
- [ ] Notification permission prompt appears, granting it stores a localStorage flag
- [ ] Clear localStorage → app reverts to landing

---

# Routine Catalog + LLM Personalization — Decision Log

Branch: `claude/refine-local-plan-Zjpds`. Replaces the binary "Original 75 HARD vs Fully customize" tier step with a routine catalog + opt-in AI chat. v1 ships scaffolding only — full curated catalog and chat polish land later.

## Catalog architecture

**Decision:** Static seed list in `lib/routine-templates.ts` is the source of truth at v1; the new `routineTemplates` Convex table exists but is read with a static fallback when empty. v2's deep-research ingestion pipeline will populate the table; the dormant `seedTemplates` internalAction in `convex/routineTemplates.ts` shows the upsert pattern.
**Why:** Two templates don't need a DB. Shipping the table + index now means the catalog migration in v2 is purely additive and doesn't require a schema change.

## Vector index ships dead

**Decision:** `routineTemplates.by_embedding` is registered with `dimensions: 1536` (OpenAI `text-embedding-3-small`) and `filterFields: ["category"]`, but no code populates `embedding` or queries the index in v1.
**Why:** Registering it now pins the dimension to whatever provider we're already wiring up for the chat (`@ai-sdk/openai`), so when the catalog grows past keyword filtering we just backfill embeddings — no schema change, no provider swap.

## AI SDK + OpenRouter (chat) / OpenAI (embeddings)

**Decision:** Vercel AI SDK (`ai`) with `@openrouter/ai-sdk-provider` for chat (default `anthropic/claude-sonnet-4-5`, override via `OPENROUTER_CHAT_MODEL`) and `@ai-sdk/openai` for embeddings.
**Why:** OpenRouter lets us swap chat models without code changes. Embeddings stay on OpenAI for stable index dimensions. The action runs in Convex's V8 runtime (no `"use node"`) because the AI SDK only needs `fetch`. Env vars set via `npx convex env set OPENROUTER_API_KEY <key>`; an unset key returns a deterministic stub so the UI works in dev.

## setupTier kept, derived from template.strictMode

**Decision:** The `setupTier` enum (`original | added`) is no longer user-facing — it's derived from `template.strictMode` on submit and persisted alongside `templateSlug` for back-compat with legacy reads (`getPreviousOnboardingState`, themed dashboards, the local-store mirror).
**Why:** Keeps existing prod data and read sites valid without a write migration; adds `templateSlug` as the new canonical identifier.

## LLM proposal sentinel

**Decision:** The model wraps structured routine proposals in a fenced ```json``` block prefixed by the literal string `<<ROUTINE_PROPOSAL>>`. `parseProposal()` looks for the last sentinel + the next fence.
**Why:** Prose mentions of `{...}` (or "I'd recommend a JSON-like structure...") would otherwise be misclassified as proposals. The sentinel is plain text so it survives any markdown-renderer mangling, and "last sentinel wins" handles the revise-on-critique case.

## Chat is signed-in only

**Decision:** The `personalize.chat` action requires `ctx.auth.getUserIdentity()`; the chat CTA on the template-select page is hidden for guests (local mode).
**Why:** OpenRouter cost + rate-limit accountability needs a Convex identity. Local-mode users still get the static catalog.

## Feature flag default: off

**Decision:** Chat is gated behind `NEXT_PUBLIC_LLM_PERSONALIZE === "1"`, default off in this PR.
**Why:** Lets us ship the catalog refactor + Convex action wiring without exposing the chat path until the prompt has been hand-tested with a real key.
