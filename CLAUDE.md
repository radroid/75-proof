# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

# currentDate
Today's date is 2026-02-26.

# Rules

## Build verification
Always run `npx next build` and confirm it passes **before** committing any changes. Do not commit code that fails the build.

## Dev server
The dev server is always already running — do not start it yourself (no `npx next dev`, `pnpm dev`, etc.).
