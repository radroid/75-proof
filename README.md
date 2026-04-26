# 75-proof

A modern, configurable **75 HARD** habit tracker.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Convex](https://img.shields.io/badge/Backend-Convex-ee342f)](https://convex.dev)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6c47ff)](https://clerk.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare_Pages-f38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](./CONTRIBUTING.md)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/radroid/75-proof?utm_source=oss&utm_medium=github&utm_campaign=radroid%2F75-proof&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Run the classic 75 HARD program or build a fully custom version. Track habits, streaks, and progress with push notifications, themes, and friends.

## Stack

Next.js 16 · React 19 · TypeScript · Convex · Clerk · Tailwind CSS v4 · shadcn/ui · Framer Motion · Web Push · OpenNext on Cloudflare Pages.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev                     # Next.js
npx convex dev               # Convex backend (separate terminal)
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `npx next build` | Production build — **must pass before committing** |
| `pnpm lint` | ESLint |
| `pnpm preview` | OpenNext Cloudflare preview |
| `pnpm deploy` | OpenNext Cloudflare deploy |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Direct pushes to `main` are blocked — open a PR.

## Deployment

- **Frontend**: Cloudflare Pages via OpenNext
- **Backend**: Convex (prod deployment)
- **Auth**: Clerk (dev + prod instances)

Env vars live in Cloudflare Pages (frontend) and the Convex dashboard (backend secrets). See `.env.example` for the list.
