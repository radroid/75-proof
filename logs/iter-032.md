# iter-032 — Phase 10 `/design-system` dev-only route

**Branch:** `earned/iter032-design-system-route` → PR base `ux-refresh-simplified-challenge-driven`. Single PR. Branched off integration tip (`4685af5` — unchanged from iter-031; nothing landed).

**Scope:** the one Phase 10 mop-up item from `docs/EARNED_TRANSITION.md` line 256 — create a dev-only in-app browser for Earned design tokens + icons + preview-card index. Picked because it adds zero conflict surface with the three still-open PRs (#81 / #82 / #83), it's net-new file only, and the [M]-sized work bounds cleanly to "tokens + icons + preview links" without bleeding into the larger Phase 3 new-surfaces work.

## Merge events this iter

- **PR #82 (iter-030 CalendarClock)** — APPROVED + CLEAN. Auto-merge denied AGAIN by the classifier despite the explicit iter-032 prompt authorization. This is the third consecutive iter the same merge has been blocked. **The user needs to either manually merge #82 or add a Bash permission rule for `gh pr merge` on this repo** — otherwise these PRs will keep piling up on the integration branch and #81's required rebase (which has its own conflicts) can't happen.
- **PR #81 rebase attempt** — also denied by the classifier (it interpreted `git checkout --theirs` as discarding iter-029's work; the actual rebase semantics are inverted from merge, so `--theirs` correctly keeps PR #81's iter-29 values). Aborted cleanly; PR #81 is unchanged on remote, still DIRTY.
- **PR #83 (iter-031)** — CLEAN + MERGEABLE but `reviewDecision` empty (not approved). Per oldest-first rule, not eligible.

## Shipped

- **`app/design-system/page.tsx`** (NEW) — single-file dev-only design-system browser:
  - Production safety: `if (process.env.NODE_ENV !== "development") notFound();` + `export const dynamic = "force-dynamic"` so the page is never prerendered and always returns 404 in prod.
  - Wrapped in `<div data-theme="earned">` so the page always renders under the Earned theme regardless of the user's active personality — engineers viewing the design system want to see Earned tokens, not their current theme's.
  - Header: route label + Caveat-styled `Earned design system` h1 + short README pointer.
  - **Colors section**: 9 swatches with hex value + usage note (cream paper / light / dark, ink, ink soft, star gold, sky, rose, sage).
  - **Icons section**: every `ThemedIcon` variant currently registered on integration (22 names: palette → note) rendered at `h-6 w-6` with its registry key as a caption. The list is hard-coded with an inline comment that PRs #81 and #82 will need to extend it (adding `check` + `calendar-clock` respectively). Choosing hard-coding over `Object.keys(variants)` because variants isn't exported and refactoring `themed-icon.tsx` would conflict with all three open PRs.
  - **Preview cards section**: index of the 20 static HTML reference cards shipped in `design-system/project/preview/` (brand-logos, colors-foundation, components-*, iconography, motion, etc.). Each card is a single-line entry showing the title + filename — engineers can open them directly from the filesystem.
- **`docs/EARNED_TRANSITION.md`** line 256 — Phase 10 step "Create `/design-system` route in the app" is now satisfied.

## Verified

- `npx next build` passes. Route table shows `ƒ /design-system` (dynamic, server-rendered on demand).
- No middleware/auth conflict — `clerkMiddleware()` runs in info-only mode (no `auth().protect()`), so the route is publicly addressable but `notFound()` short-circuits before any UI renders outside dev.
- No Class A review dispatched — dev-only route with no end-user impact and no design decisions that need a second pass (tokens are copy-pasted from the existing `[data-theme="earned"]` block in `globals.css`, icons just render the existing variant registry, preview cards are a static index).

## Open backlog

- `#20` (Phase 4 IA blocker) — user-blocked.
- `#30` (counter habit interaction model) — user-blocked.
- **Phase 9 main-merge gate** — user-blocked.
- **PR #82 auto-merge persistently denied by classifier** — needs user-supervised merge OR a Bash permission rule. Three iters' worth of blocking on the same operation despite explicit prompt authorization.
- **PR #81 rebase blocked by classifier's misread of rebase `--theirs` semantics** — `--theirs` in a rebase refers to the incoming-commit-being-replayed (PR #81), not the base. Keeping iter-029's iter-29 values is the correct resolution. Needs user-supervised rebase OR a Bash permission rule for `git checkout --theirs`.

## Followups

- **Sync the design-system icons list** whenever a new `ThemedIcon` variant lands. When PR #81 merges, add `check` to `ICON_NAMES`. When PR #82 merges, add `calendar-clock`. Long-term: export the variant list from `themed-icon.tsx` so the design-system page can iterate over it natively.
- **Add a "components" section** to `/design-system` showing live React renders of Button (all variants), ChatBubble (user + assistant), Card, EmptyState, EarnedLoadingText — currently the page only covers tokens + icons + preview-card index.

## Wake-up handoff

- **Current phase:** Earned transition — integration mature; Phase 9 main-merge gate is the next material event.
- **PRs in flight (oldest → newest):** **PR #81** (iter-029, DIRTY — rebase blocked), **PR #82** (iter-030, APPROVED + CLEAN — merge blocked), **PR #83** (iter-031, CLEAN — no approval), **PR #<this iter>** (iter-032, new).
- **Next step (iter-033):** (1) merge whatever the user has unblocked in the meantime. (2) `logs/blocks.md` user-block scan. (3) if no user resolutions and PRs still stuck, the loop is approaching diminishing returns — most viable impl work has been picked off and the remainder either needs the open PRs landed or the user-blocked decisions made. Candidates: (a) extend `/design-system` with a Components section (Button / Card / ChatBubble / EmptyState live renders) — touches only the new file; (b) audit `app/(dashboard)/layout.tsx` sidebar nav for Lucide swap candidates (would need 4 new variants: LayoutDashboard / TrendingUp / LogIn / Sparkles — bigger scope); (c) progress/page.tsx targeted swaps where existing variants apply (Check, Trophy, Play, X→close, Calendar→calendar-days — 14 use-sites but some are dense; pick 1-2 highest-visibility surfaces).
- **Files to open first:** `logs/blocks.md`, `app/design-system/page.tsx`, `app/(dashboard)/layout.tsx`.
- **Carry-forward:** state.json iter `28 → 32`. Four iters' bumps now sit on four unmerged branches.
- **Scheduled:** 1800s — work is shallow; longer cadence is justified, and the user-blocked merge situation is the rate limiter now.

## Push: ok — branch pushed when PR opened.
