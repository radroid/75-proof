# PostHog Integration — Collaboration Doc

Shared tracker for the full PostHog integration on 75 Proof. Claude handles code; you (Raj) handle anything that requires the PostHog UI, billing, or account-level setup. Update the status columns as we go.

- Branch: `feat/posthog-full-integration`
- PostHog organization: **Create Club**
- Active project: **Default project** (id `319474`, token `phc_2wWqdbJLX7UCdWWSonQwYTngK1vqzYq2xffTQmkjKze`) — all events flow here today
- Other project: **75 Proof** (id `393036`, token `phc_zo6Vj59P69NXTUY2Zb9YaHRUjFYCrWerNKRevCgCVGJS`) — empty, see [§8](#8-project-choice)
- Product Health dashboard: https://us.posthog.com/project/319474/dashboard/1498476
- Onboarding-tour feature flag: https://us.posthog.com/project/319474/feature_flags/651813
- Error-rate alert: configured on Unhandled error rate insight (id 8113384)

---

## Status legend
- ✅ Done  · 🟡 In progress  · ⬜ Not started  · 🔒 Blocked (needs user action)

---

## 1. Production-only mode — how to run it correctly

PostHog now **only initializes in production**. In dev it is a no-op — no events, no network traffic, no session recording, no console noise.

### How it's gated

`instrumentation-client.ts`:

```ts
const shouldInit =
  !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
  (process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_POSTHOG_FORCE_ENABLE === "1");
```

Two conditions must be true for PostHog to load:
1. `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set in the environment.
2. Either `NODE_ENV === "production"` (production build) or `NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=1` (opt-in override — useful for manual QA on a preview).

### Your env-var setup checklist

| File / scope | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | `NEXT_PUBLIC_POSTHOG_HOST` | `NEXT_PUBLIC_POSTHOG_FORCE_ENABLE` |
|---|---|---|---|
| `.env.local` (your dev machine) | ❌ unset (or delete the line) | ❌ unset | ❌ unset |
| `.env.production` (if used) | ✅ set to real token | ✅ `https://us.i.posthog.com` | ❌ unset |
| Cloudflare Workers / OpenNext secrets (prod deploy) | ✅ set | ✅ set | ❌ unset |
| Preview deploys (if you want telemetry) | ✅ set | ✅ set | ✅ `1` |

**Action for you:**
1. Open `.env.local` and remove (or comment out) the two `NEXT_PUBLIC_POSTHOG_*` lines. Dev will then be silent.
2. On Cloudflare, add the two env vars via `wrangler secret put` or the dashboard so `pnpm deploy` picks them up.
3. Calls like `posthog.capture("day_completed", …)` are safe in both envs — in dev the SDK is not loaded, so the calls are silent no-ops.

### Sanity check

- Run `pnpm dev` → open DevTools → Network tab → filter for `ingest` or `posthog` → you should see **zero** requests.
- Run `pnpm build && pnpm start` (or deploy preview with `NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=1`) → you should see events in the PostHog Live view within seconds.

---

## 2. What Claude shipped (code-side)

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | `posthog-js` init + reverse-proxy rewrites | ✅ | `instrumentation-client.ts`, `next.config.ts` |
| 2 | Production-only init guard | ✅ | Described in §1 |
| 3 | Session replay enabled with privacy defaults | ✅ | `maskAllInputs: true`, `[data-ph-mask]` selectors, `[data-ph-no-capture]` block selector |
| 4 | Autocapture restricted to click/change/submit on buttons/links | ✅ | Reduces replay payload + noise |
| 5 | Identify Clerk users + enriched person properties | ✅ | `components/PostHogUserIdentifier.tsx` — sends `onboarding_complete`, `longest_streak`, `lifetime_restart_count`, `has_active_challenge`, `current_day`, `challenge_status`, `theme`, `timezone`, `created_at` |
| 6 | Global error boundary → `captureException` | ✅ | `app/error.tsx` |
| 7 | 19 product events instrumented | ✅ | See table in §3 |
| 8 | **Remotion removed entirely** | ✅ | Deleted `remotion/` folder, `/onboarding/tutorial` route, 4 deps (`remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/transitions`, `@remotion/google-fonts`), 2 scripts. Run `pnpm install` to regenerate the lockfile. |
| 9 | **In-app tour replacing Remotion tutorial** | ✅ | `components/DashboardTour.tsx` — 5-step modal tour on `/dashboard`, gated by PostHog feature flag `show-onboarding-tour` AND `!user.hasSeenTutorial`. Re-uses existing Convex `markTutorialSeen` / `resetTutorialSeen` mutations. Replay button in Settings still works. |
| 10 | PostHog React hook — `useFeatureFlagEnabled` | ✅ | From `posthog-js/react` subpath |
| 11 | BACKLOG.md updated | ✅ | P-5 marked done, Remotion section collapsed as cancelled |

---

## 3. Events currently captured

| Event | Where |
|---|---|
| `workout_logged` | `components/DailyChecklist.tsx` |
| `workout_details_saved` | `components/DailyChecklist.tsx` |
| `progress_photo_uploaded` | `components/DailyChecklist.tsx` |
| `day_completed` | `components/DailyChecklist.tsx` |
| `challenge_started` | `components/StartChallengeModal.tsx` |
| `challenge_failed_restart_clicked` | `components/ChallengeFailedDialog.tsx` |
| `challenge_reset_progress` | `app/(dashboard)/dashboard/settings/page.tsx` |
| `challenge_reset_reconfigure` | `app/(dashboard)/dashboard/settings/page.tsx` |
| `settings_saved` | `app/(dashboard)/dashboard/settings/page.tsx` |
| `tour_replay_requested` | `app/(dashboard)/dashboard/settings/page.tsx` |
| `onboarding_completed` | `app/(onboarding)/onboarding/page.tsx` |
| `friend_request_sent` | `components/friends/friends-list.tsx` |
| `friend_request_accepted` | `components/friends/requests-tab.tsx` |
| `friend_request_declined` | `components/friends/requests-tab.tsx` |
| `guest_signup_clicked` | `components/guest-signup-banner.tsx` |
| `pwa_install_accepted` | `components/pwa/install-prompt.tsx` |
| `tour_started` | `components/DashboardTour.tsx` |
| `tour_step_viewed` | `components/DashboardTour.tsx` (props: `step_id`, `step_index`) |
| `tour_completed` | `components/DashboardTour.tsx` |
| `tour_skipped` | `components/DashboardTour.tsx` |
| `$exception` | `app/error.tsx` (via `posthog.captureException`) |

---

## 4. What Claude configured inside PostHog (via MCP)

| # | Item | Status | Details |
|---|------|--------|---------|
| A | Feature flag `show-onboarding-tour` | ✅ | 100% rollout, active. Turn off here to kill the tour: https://us.posthog.com/project/319474/feature_flags/651813 |
| B | Dashboard "75 Proof — Product Health" | ✅ | Pinned, 7 tiles. https://us.posthog.com/project/319474/dashboard/1498476 |
| C | Insight: Onboarding → Challenge start funnel | ✅ | `/insights/zv4dJkkh` |
| D | Insight: Daily completion trend | ✅ | `/insights/MMgNMh3q` |
| E | Insight: Churn & restart signals | ✅ | `/insights/wvwtbtwy` |
| F | Insight: Social engagement | ✅ | `/insights/f2x53BXn` |
| G | Insight: Tour start → completion funnel | ✅ | `/insights/hcjhI8LF` |
| H | Insight: Unhandled error rate | ✅ | `/insights/OfVrqglO` |
| I | Insight: Daily active users (DAU) | ✅ | `/insights/7ccso2NU` |
| J | Alert: "New exceptions detected" | ✅ | Daily check, fires if exceptions > 5/day, emails raj9dholakia@gmail.com |

---

## 5. What YOU still need to do (requires PostHog UI / account)

| # | Task | Status | Where |
|---|------|--------|-------|
| U1 | **Turn on Session Recording at the project level** (SDK config is ready, but project-level switch is manual) | 🔒 | Settings → Product analytics → Recordings → toggle on, set sampling to 100% while small |
| U2 | **Turn on Error Tracking** (and optional Slack/email for new issue groups) | 🔒 | Error tracking → Settings → Alerting |
| U3 | **Subscribe to daily email digest** of the Product Health dashboard (this is the "daily report" you asked for — there is no MCP tool for Subscriptions, only UI) | 🔒 | Open dashboard 1498476 → menu → **Subscribe** → daily at 09:00 UTC → your email |
| U4 | **Verify events land in Live view** after deploying | 🔒 | Activity → Live events |
| U5 | **Remove PostHog env vars from `.env.local`** so dev is silent (see §1 table) | 🔒 | Your local file |
| U6 | **Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` + `NEXT_PUBLIC_POSTHOG_HOST` to Cloudflare secrets** | 🔒 | `wrangler secret put` |
| U7 | **Run `pnpm install`** to regenerate the lockfile after Remotion removal | 🔒 | Local — commit the updated lockfile afterwards |
| U8 | **Push the branch + open PR** once you're happy with the review | 🔒 | `git push -u origin feat/posthog-full-integration` |
| U9 | (Optional) Decide whether to consolidate on the "75 Proof" project 393036 | 🔒 | See §8 |

---

## 6. Things Claude CANNOT do (hard limits)

- **Approve OAuth / grant MCP access.** (Already done — MCP is authed for this session.)
- **Create PostHog dashboard subscriptions / scheduled email digests.** PostHog's MCP exposes Alerts (anomaly/threshold) but not Subscriptions. The daily digest is U3 above — a two-click manual step in the PostHog UI.
- **Change PostHog billing / plan.** Session recording, Error tracking, and Surveys each have free-tier thresholds. If volume exceeds the free tier, upgrade or reduce sampling.
- **Push to remote or deploy to Cloudflare.** Per CLAUDE.md rules, the user runs `git push` and `pnpm deploy`.
- **Set email routing for alerts.** Alerts go to `raj9dholakia@gmail.com` because that's the PostHog user email; to change it, edit your PostHog profile.
- **Write secrets to `.env.local`.** Anything secret you paste into the conversation, I'll stage — but the user is always the one committing env files.

## 7. Things Claude CAN do (just ask)

- Add or remove `posthog.capture(...)` calls for any new event.
- Extend the tour (add steps, change copy, re-order).
- Tune replay masking (which CSS selectors to mask/block).
- Create more dashboards, insights, alerts, surveys, feature flags via MCP.
- Add feature flags to code via `useFeatureFlagEnabled` / `posthog.isFeatureEnabled`.
- Write a `posthog-server.ts` helper for server-side captures from Convex actions / API routes if you want backend events.

---

## 8. Project choice — `319474` vs `393036`

There are two PostHog projects in the Create Club org:

- **Default project** (`319474`) — where events currently flow. All insights/dashboard/flag/alert above live here. Contains historical test events.
- **75 Proof** (`393036`) — named after the app, currently empty.

Current code uses `319474` (the token already in `.env.local`). If you'd prefer to move to the `75 Proof` project:

1. Swap `.env.local` / Cloudflare secrets to the `393036` token (`phc_zo6Vj59P69NXTUY2Zb9YaHRUjFYCrWerNKRevCgCVGJS`).
2. Ping me and I'll recreate the dashboard, insights, flag, and alert in the `75 Proof` project via MCP. (Or we can use PostHog's copy-dashboard feature.)
3. Archive/delete `319474` when you're satisfied.

My recommendation: **stay on 319474 for now** — you have a working integration and no production traffic has landed yet. Once real users are on the app, consolidate to `75 Proof` in a follow-up.

---

## 9. Answers to your open questions

1. **Session recording sampling** — enabled at 100% at the SDK level. Change in PostHog Settings → Recordings for project-level override.
2. **Tour content** — 5 steps shipped (welcome → Daily Six → photo → water → social). Edit `components/DashboardTour.tsx` to change copy/order.
3. **Daily report recipients** — alert goes to `raj9dholakia@gmail.com`. To add more, subscribe them individually via PostHog UI (U3).
4. **Privacy copy** — Claude did not add landing-page privacy copy — recommend a line like: *"We use PostHog for product analytics. Text inputs are masked in session replays and we never sell your data."* Ping me and I'll add it to your privacy/landing section.

---

## 10. Changelog

- 2026-04-22 — Branch created, session replay + autocapture tuning, production-only init guard, Remotion removed (folder/route/4 deps/2 scripts), in-app `DashboardTour` shipped gated by `show-onboarding-tour` feature flag, `PostHogUserIdentifier` extended with challenge/theme props, PostHog dashboard "75 Proof — Product Health" created with 7 insights, error-rate alert configured, BACKLOG.md updated. (Claude)
