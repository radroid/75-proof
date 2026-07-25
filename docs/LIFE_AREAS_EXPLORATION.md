# Life Areas — multi-domain life organizer (experiment)

Status: **exploration / experiment**. Captured 2026-07-25 from a founder brain-dump.
Not scheduled. This doc organizes the idea, maps it onto the existing schema, sizes the
refactor, and proposes a phased path that starts with a zero-migration prototype.

## 1. The idea in one paragraph

Today the app is a single-challenge habit tracker (75-hard and routine variants). The idea is
to let a user **organize all parts of their life into switchable "areas"** — self-care, fitness,
work/business, personal finance — and have the chosen area become the app's landing view, the
same way the **theme switcher** changes the app's skin today. Inside an area lives a mix of
**periodic tasks** (not just daily: skincare daily, dental every 6 months, a one-off errand),
each with a name, a recurrence, and a done/not-done state. Two layers ride on top of each task:
a **research/notes layer** (knowledge the user accretes over time) and a **product/usage log**
(e.g. every night cream or toner tried for a skincare routine). It's a habit-tracker + to-do +
personal-wiki hybrid, sliced by life area.

Founder's own first use case: **self-care** — a skincare routine plus periodic things
(dental appointments), where the skincare task accumulates researched notes and a log of the
specific products (night creams, toners) used over time.

## 2. Primitives

| Primitive | What it is | Nearest thing today |
|---|---|---|
| **Area** | A top-level life domain the user switches between; the active area is the landing view. Self-care, fitness, work, business, finance… | `themePersonality` switch UX; `habitDefinitions.category` (already a string field) |
| **Task / Ritual** | A named unit of work inside an area, with a recurrence and a completion state. Spans daily habit → periodic chore → one-off to-do. | `habitDefinitions` (name, blockType task/counter, target, isActive, category, icon) |
| **Occurrence** | A single due instance of a task (today's skincare, this month's dental) + its completion. | `habitEntries` — but today these are **daily-only**, keyed by `dayNumber` |
| **Notes / research layer** | Free-form knowledge attached to a task, grown over time. | *(none — new)* |
| **Product / usage log** | Items tried for a task (night creams, toners): name, category, started/ended, rating, notes. | *(none — new)* |

## 3. Mapping onto the existing model (what we can reuse)

The good news: three of the five primitives already have strong analogues, so this is **less of a
rebuild than it looks**.

- **Area ≈ a grouping over `habitDefinitions.category`.** That optional string field already
  exists on every habit. The very first prototype needs *no schema change* — just group the
  active challenge's habits by `category` and let the user pick which group is the landing view.
  (A later, cleaner model promotes Area to its own table — see Phase 4.)
- **Open-ended tracking already exists.** `challenges` support a habit-tracker mode
  (`isHabitTracker: true`, `daysTotal: null`) with no fixed end — so an "area" doesn't need to be
  a time-boxed 75-day challenge. The container is already there.
- **The theme switcher is the exact UX precedent** for the area switcher: `components/theme-switcher.tsx`
  + `components/theme-provider.tsx` persist a choice and re-skin the app on selection. An
  `AreaProvider` + `AreaSwitcher` mirrors that shape (persisted selection → landing view), and can
  even live next to the theme switcher in Settings, as the founder pictured.
- **Task = `habitDefinitions`** almost as-is: `name`, `blockType` (task/counter), `target`,
  `unit`, `isActive`, `icon`, `category`, `sortOrder`.

### The real gaps (net-new work)

1. **Recurrence beyond daily — the core schema change.** `habitEntries` are indexed
   `by_challenge_day` / `by_habit_day` on a `dayNumber` — a daily cadence inside a numbered
   challenge. Periodic ("every 6 months") and one-off ("dental on 2026-09-14") tasks don't fit a
   `dayNumber` grid. Options:
   - **(a) Recurrence rule + generated occurrences.** Add a `recurrence` to the task
     (`daily | weekly | monthly | everyN{unit,n} | once`) and model occurrences by **due date**
     rather than day number. Completion becomes "did occurrence due on DATE get done." This is the
     honest model and unlocks streaks-per-cadence.
   - **(b) Due-date task, no grid.** For one-offs/periodics, store just `nextDueDate` + `lastDoneAt`
     and recompute next due on completion. Simpler; loses historical occurrence rows.
   - *Recommend (a)* long-term, but a due-date field (b) is enough to prototype the feel.
   - Ties into the **existing open decision** "new habits apply forward-only" (BACKLOG Open
     decisions) — periodic tasks are forward-only by nature, so they sidestep the historical-day
     recompute problem.
2. **Notes / research layer.** New `taskNotes` table (or a rich-text field on the task):
   `{ habitDefinitionId, body, updatedAt }`. Low-risk, additive.
3. **Product / usage log.** New `taskProducts` table: `{ habitDefinitionId, name, kind (e.g.
   "night-cream" | "toner"), startedAt, endedAt?, rating?, notes? }`. Low-risk, additive.
4. **Area as first-class entity (eventual).** Promote from a `category` string to an `areas` table
   `{ userId, name, icon, color, sortOrder }` + `habitDefinitions.areaId`. A migration, deferred to
   Phase 4 once the concept has proven itself.

## 4. Refactor scope & risk

- **Prototype (Phase 0): S.** No schema change, no prod flows touched. A self-contained route with
  mock data proves the switch-area-→-landing feel + the notes/product layers visually.
- **Periodic tasks (Phase 1): L.** The `dayNumber` → due-date shift is the deep one; touches the
  completion model, streak math (`lib/progress-metrics.ts`), and the local-store mirror
  (`lib/local-store/`). Do behind a flag, additive to the daily model (don't rip it out).
- **Notes + products (Phases 2–3): M each.** Additive tables + simple CRUD + UI; guest/local-store
  parity needed.
- **Area table + migration (Phase 4): M–L.** Only after the concept earns it.

Biggest risk: letting this balloon into a rewrite. Mitigation — **Phase 0 is a throwaway**, and
every later phase is additive behind a flag, never a big-bang migration of the daily tracker.

## 5. Phased plan

- **Phase 0 — Prototype (no migration).** `/experiments/life-areas` route (or the `prototype`
  skill's toggle-variations approach): an Area switcher (Self-care / Fitness / Work / Finance)
  that swaps the landing list; each area shows periodic tasks as a to-do + habit blend; tapping a
  task opens a detail sheet with a **Notes** tab and a **Products** tab. All mock data. Goal: feel
  the interaction, decide if it's worth the real build. *(This is the piece being built now.)*
- **Phase 1 — Recurrence model** behind a flag: task `recurrence` + due-date occurrences, additive
  to daily habits.
- **Phase 2 — Notes/research layer** on real tasks.
- **Phase 3 — Product/usage log** on real tasks.
- **Phase 4 — Promote Area to a first-class table** + migrate `category` → `areaId`; area switcher
  graduates from experiment to Settings.

## 6. Open questions (for the founder, async)

1. **Is an Area a filter or a container?** i.e. does one habit belong to exactly one area, or can
   it appear in several? (Recommend: exactly one, via `areaId`, to keep the model clean.)
2. **Does switching area also switch theme?** The founder tied the two together mentally
   ("like the theme toggle"). Keep them independent (area = content, theme = skin), or let an
   area *carry* a default theme?
3. **How social is this?** Friends/streak-sharing exist for challenges. Are areas private by
   default? (Recommend: private; sharing is per-area opt-in later.)
4. **Does 75-hard survive as-is,** i.e. is "75-hard" just one area with a fixed-length challenge
   inside it, or a separate mode? (Recommend: 75-hard becomes the "Fitness" area's flagship
   challenge — one unified model.)
5. **Recurrence granularity for v1:** daily / weekly / monthly / every-N-months / once — enough?

## 7. Why it helps users

One app that holds *all* of someone's recurring life-admin — not just a 75-day fitness sprint —
with the accumulated context (notes + product history) that makes each routine actually
improvable over time. It turns a single-purpose streak app into a durable, daily-use personal
operating system, which is a much stronger retention story than a time-boxed challenge that ends.
