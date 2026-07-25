# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

# currentDate

Today's date is 2026-04-28.

# Rules

Package manager: bun. Use `bun install` / `bun add` / `bun remove`; do not run `pnpm` or `npm install` against this repo. The lockfile is `bun.lock` — only that lockfile should be committed.

## Build verification

Always run `npx next build` and confirm it passes **before** committing any changes. Do not commit code that fails the build.

## Tests

Run the suite with `bun run test` (the package script → `vitest run`). Do **not** run bare `bun test`: Bun's own test runner shadows the script, tries to execute the vitest files itself, and chokes on `import.meta.glob` — falsely reporting failures. CI (`.github/workflows/ci.yml`) calls `bun run test` for this reason.

Lint (`bun run lint`) currently reports ~141 pre-existing **source** errors (mostly `no-explicit-any`). This is known debt — CI runs lint as a non-blocking/informational step so it doesn't gate PRs. `.open-next/**` (the generated Cloudflare bundle) is ignored in `eslint.config.mjs`; do not remove that ignore or the count jumps back to ~26,700.

## Dev server

The dev server is *intended* to be always already running — do not start a duplicate (no `npx next dev`, `bun dev`, etc.) if one is up. Note: as of 2026-07, the only Next dev server found running was a **different** project (`flighty-replica` on :3000); this repo's server may be down. Confirm what's on a port (`curl -s localhost:PORT | grep '<title>'` — this app's title is `earned`) before assuming it's this app. A service worker is registered even in dev and **serves stale JS/CSS chunks** — after switching branches, unregister it + clear caches (DevTools → Application, or `navigator.serviceWorker.getRegistrations()` → `unregister()`) or visual QA will show old code.

## Tailwind class style

Do not proactively rewrite Tailwind utility classes into canonical shorthand forms (for example, bracket/arbitrary values to parenthesis variants) unless the user explicitly asks for that refactor.

## Pull request workflow

When you open a PR, set the assignee to `@me` (the authenticated gh user — currently `radroid`) and request a review from `radroid`. GitHub silently rejects the review request when the author and requested reviewer are the same account, so until a separate collaborator or bot identity is added to the repo, only the assignee field will stick — this is expected, not a failure to report. Use `gh pr edit <N> --add-assignee @me --add-reviewer radroid` right after `gh pr create`.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
