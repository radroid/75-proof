# Contributing

Thanks for helping out! A few ground rules to keep things clean.

## Workflow

1. Branch off `main`: `git checkout -b feat/short-description` (or `fix/...`, `chore/...`).
2. Make your changes. Keep PRs focused — small, reviewable diffs beat large ones.
3. Run the build **before** pushing:
   ```bash
   npx next build
   bun lint
   ```
4. Open a PR against `main`. Direct pushes are blocked.
5. A PR requires **1 approving review** and must not break the build.

## Commit messages

Conventional-ish prefixes we use in this repo:

- `feat: ...` — new user-facing functionality
- `fix: ...` — bug fix
- `refactor: ...` — internal change, no behavior change
- `style: ...` — formatting / class shuffles
- `chore: ...` — tooling, deps, config
- `docs: ...` — README / comments only

Keep the subject under ~70 chars. Explain the *why* in the body if non-obvious.

## Code conventions

- **Package manager**: use `bun` for `install` / `add` / `remove` / `run` in this repo. The lockfile migration (regenerating `bun.lock` and dropping `pnpm-lock.yaml`) is tracked in a separate PR — until that lands, follow whichever lockfile is currently committed and don't introduce a competing one.
- **Tailwind**: don't rewrite arbitrary-value classes into canonical forms unless the change is the point of the PR.
- **Convex**: always skim `convex/_generated/ai/guidelines.md` before editing `convex/`.
- **Schema changes**: favor back-compat (keep legacy union literals, remap on read) over data migrations when practical.
- **Comments**: only when the *why* is non-obvious. Don't narrate what the code does.

## Environment

Copy `.env.example` → `.env.local` and fill in the values. Ask the repo owner for dev Clerk + Convex keys if you don't already have them.

## Testing UI changes

Type-check and lint verify correctness, not feature behavior. For UI work, exercise the happy path + at least one edge case in the browser and note what you tested in the PR body.
