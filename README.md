# earned

A notebook-style habit tracker. Show up daily, mark the page, earn the star. Built around a single rule: **today, did I show up?**

Visual + voice rules live in [`design-system/`](./design-system/). The active Earned brand is one of several themes today; the multi-week transition is tracked in [`docs/EARNED_TRANSITION.md`](./docs/EARNED_TRANSITION.md).

## Stack

Next.js 16 · React 19 · TypeScript · Convex · Clerk · Tailwind CSS v4 · shadcn/ui · Framer Motion · Web Push · OpenNext on Cloudflare Pages.

## Quick start

```bash
bun install
cp .env.example .env.local   # fill in values
bun dev                      # Next.js
npx convex dev               # Convex backend (separate terminal)
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `bun dev` | Next.js dev server |
| `npx next build` | Production build — **must pass before committing** |
| `bun lint` | ESLint |
| `bun run preview` | OpenNext Cloudflare preview |
| `bun run deploy` | OpenNext Cloudflare deploy |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Direct pushes to `main` are blocked — open a PR.

## Deployment

- **Frontend**: Cloudflare Pages via OpenNext
- **Backend**: Convex
- **Auth**: Clerk

Env vars live in Cloudflare Pages (frontend) and the Convex dashboard (backend secrets). See `.env.example` for the list.
