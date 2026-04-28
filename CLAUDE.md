# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

# currentDate

Today's date is 2026-02-26.

# Rules

Package manager: bun. Use `bun install` / `bun add` / `bun remove`; do not run `pnpm` or `npm install` against this repo. The lockfile is `bun.lock` — only that lockfile should be committed.

## Build verification

Always run `npx next build` and confirm it passes **before** committing any changes. Do not commit code that fails the build.

## Dev server

The dev server is always already running — do not start it yourself (no `npx next dev`, `bun dev`, etc.).

## Tailwind class style

Do not proactively rewrite Tailwind utility classes into canonical shorthand forms (for example, bracket/arbitrary values to parenthesis variants) unless the user explicitly asks for that refactor.

## Pull request workflow

When you open a PR, set the assignee to `@me` (the authenticated gh user — currently `radroid`) and request a review from `radroid`. GitHub silently rejects the review request when the author and requested reviewer are the same account, so until a separate collaborator or bot identity is added to the repo, only the assignee field will stick — this is expected, not a failure to report. Use `gh pr edit <N> --add-assignee @me --add-reviewer radroid` right after `gh pr create`.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
