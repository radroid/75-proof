# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

# currentDate

Today's date is 2026-04-28.

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

## Earned voice + visual conventions

The product is mid-transition to the Earned brand. When writing UI copy or building new surfaces, follow these rules (full spec in `design-system/project/README.md`):

**Voice**
- First-person where it lands naturally: "I showed up" over "You completed."
- Sentence case for headings, labels, and toasts. No trailing exclamations.
- No emoji in UI strings. Carve-outs: user-entered habit names, journal entries, and reaction-emoji content the user picked themselves.
- Word swaps: "Completed" → "Showed up"; "Failed" → "Skipped"; "Score" → "Streak"; "Goal" → "Habit"; "Today's tasks" → "Today's page."
- Errors stay clear but kind: "That didn't save — try again?" instead of "Failed to update."

**Visual (when working inside the Earned theme)**
- Cream paper background (`#F4ECD8`), ink text (`#1F1F1D`), gold star (`#D8A830`), sky accent (`#0090D8`).
- Caveat (handwritten) for moments + numbers; Poppins for structure.
- Hand-trembled SVG strokes, 1.5–2px, round caps/joins, slight rotation. No icon library defaults inside Earned surfaces — pick a hand-drawn variant or leave a TODO.
- No spinners. Loading states use handwritten "loading…" with a subtle scribble; reduced-motion users get a static ellipsis.
- Sticker shadow on accent chips: `2px 2px 0 var(--earned-ink)`.

Other themes (arctic / broadsheet / military / zen) keep their original voice + visual rules. The Earned restyle lands per-surface; check `docs/EARNED_TRANSITION.md` for which surfaces have already flipped.

## Earned transition — branch + merge rule (active)

While the Earned UX transition is in flight, **do not merge anything to `main`**. All work targets `ux-refresh-simplified-challenge-driven` as the integration branch. Open PRs from sub-branches *into* `ux-refresh-simplified-challenge-driven`, let CodeRabbit / review pass, and merge there. The full feature branch will land on `main` later (see Phase 9 of `docs/EARNED_TRANSITION.md`).

Use `gh pr create --base ux-refresh-simplified-challenge-driven` so PRs target the right base. This rule lifts once the transition is ready to ship to prod.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
