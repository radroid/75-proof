# CLAUDE.md - 75 Proof (75 HARD Tracker)

## Project Overview

A cross-platform application for tracking the 75 HARD challenge with social accountability features and health device integrations. Built with a focus on beautiful, modern UI.

**Tech Stack:**
- Frontend: Next.js 15 (App Router) for web
- Mobile: React Native with Expo
- Backend: Convex (database + real-time + serverless functions)
- Auth: Clerk
- UI: shadcn/ui + 21st.dev components + Tailwind CSS
- Monorepo: Turborepo + pnpm

---

## MCP Servers

### shadcn/ui
- **Purpose**: Access shadcn/ui component registry, browse components, install with natural language
- **Configuration**: Add to `.mcp.json` in project root:
```json
{
  "mcpServers": {
    "shadcn": {
      "type": "stdio",
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```
- **Usage**:
  - "Show me all available components in the shadcn registry"
  - "Add a login form"
  - "Install the calendar component"

### 21st.dev Magic
- **Purpose**: Generate beautiful UI components from natural language descriptions
- **Get API Key**: https://21st.dev/magic/console
- **Configuration**: Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "your-21st-dev-api-key"
      }
    }
  }
}
```
- **Usage**:
  - "/ui create a modern navigation bar with responsive design"
  - "/ui design a dashboard card showing user analytics"
  - "/ui create a progress tracker with animated completion states"

### Combined MCP Configuration
Create `.mcp.json` in your project root:
```json
{
  "mcpServers": {
    "shadcn": {
      "type": "stdio",
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    },
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "${TWENTYFIRST_DEV_API_KEY}"
      }
    }
  }
}
```

After adding configuration, restart Claude Code and run `/mcp` to verify servers are connected.

---

## UI Design Guidelines

### Design Philosophy
- **Modern & Clean**: Minimal, purposeful interfaces inspired by the best of 21st.dev
- **Mobile-First**: Design for mobile, enhance for desktop
- **Motivational**: UI should inspire users to complete their challenge
- **Progress-Focused**: Visual feedback for streaks, completion, milestones

### Component Library Priority
1. **shadcn/ui** - Base components (buttons, inputs, cards, dialogs, etc.)
2. **21st.dev Magic** - Custom, beautiful components for unique features
3. **Custom** - Only when neither library has what we need

### Styling Rules
- Use Tailwind CSS exclusively (no inline styles, no CSS modules)
- Follow shadcn/ui's design tokens and CSS variables
- Dark mode support required for all components
- Use `cn()` utility for conditional class merging

```typescript
// Good
import { cn } from "@/lib/utils"

<div className={cn(
  "rounded-lg border bg-card p-4",
  isCompleted && "border-green-500 bg-green-50 dark:bg-green-950"
)}>
```

### Color Palette
```css
/* Primary - For CTAs, progress indicators */
--primary: 222.2 47.4% 11.2%;

/* Success - Challenge completion, streaks */
--success: 142 76% 36%;

/* Warning - Incomplete items, reminders */
--warning: 38 92% 50%;

/* Destructive - Failed challenges, errors */
--destructive: 0 84% 60%;
```

### Typography
- Font: Inter (system fallback: -apple-system, BlinkMacSystemFont)
- Headings: Bold, tracking-tight
- Body: Regular, leading-relaxed
- Numbers/Stats: Tabular nums for alignment

### Animation Guidelines
- Use Framer Motion for complex animations
- Keep transitions under 300ms for UI feedback
- Use spring animations for natural feel
- Respect `prefers-reduced-motion`

```typescript
// Good
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
```

### Key UI Components to Build

| Component | Library | Notes |
|-----------|---------|-------|
| Daily Check-in Card | 21st.dev | Hero component, needs to be beautiful |
| Progress Ring | Custom + Framer | Animated circular progress for day count |
| Habit Checklist | shadcn/ui Checkbox | With satisfying check animations |
| Water Tracker | 21st.dev | Visual water level indicator |
| Streak Counter | 21st.dev | Animated flame/fire for streaks |
| Friend Activity Feed | shadcn/ui + custom | Timeline-style feed |
| Progress Photo Grid | shadcn/ui | Masonry-style photo gallery |
| Milestone Badges | 21st.dev | Celebratory achievement cards |

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No `any` types - use `unknown` and narrow with type guards
- Prefer `interface` for object shapes, `type` for unions/intersections
- Export types from a central `types/` directory in the shared package
- Use Zod for runtime validation; infer types from Zod schemas

```typescript
// Good
import { z } from 'zod';

export const WorkoutLogSchema = z.object({
  type: z.enum(['strength', 'cardio', 'yoga', 'sports', 'other']),
  name: z.string().min(1),
  durationMinutes: z.number().min(1),
  isOutdoor: z.boolean(),
});

export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;
```

### Naming Conventions
- **Files:** kebab-case (`daily-log-card.tsx`, `use-challenge.ts`)
- **Components:** PascalCase (`DailyLogCard`, `WorkoutTimer`)
- **Functions/variables:** camelCase (`getDailyLog`, `isOutdoorWorkout`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_WATER_OZ`, `CHALLENGE_DAYS`)
- **Convex functions:** camelCase matching the action (`createChallenge`, `getDailyLog`)

### File Organization

```
# Web app (Next.js)
apps/web/app/(dashboard)/day/[dayNumber]/page.tsx  # Route pages
apps/web/components/daily-log/daily-log-card.tsx   # Feature components
apps/web/components/ui/                             # shadcn/ui components
apps/web/lib/utils.ts                               # Utilities
apps/web/hooks/use-challenge.ts                     # Custom hooks

# Mobile app (Expo)
apps/mobile/app/(tabs)/today.tsx                    # Tab screens
apps/mobile/components/                             # Mobile components
apps/mobile/lib/health-kit.ts                       # Platform-specific

# Shared package
packages/shared/types/challenge.ts                  # Shared types
packages/shared/validation/daily-log.ts             # Zod schemas
packages/shared/constants/challenge.ts              # Constants

# Convex backend
packages/convex/schema.ts                           # Database schema
packages/convex/functions/challenges.ts             # Challenge mutations/queries
packages/convex/functions/daily-logs.ts             # Daily log functions
packages/convex/lib/auth.ts                         # Auth helpers
```

---

## Convex Conventions

### Schema Definition
- Define all tables in `schema.ts`
- Use descriptive field names
- Add indexes for frequently queried fields
- Document relationships in comments

```typescript
// Good
export default defineSchema({
  challenges: defineTable({
    userId: v.string(), // Clerk user ID
    startDate: v.string(), // ISO date string
    currentDay: v.number(),
    status: v.union(v.literal('active'), v.literal('completed'), v.literal('failed')),
    visibility: v.union(v.literal('private'), v.literal('friends'), v.literal('public')),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),
});
```

### Functions
- Use `query` for reads, `mutation` for writes, `action` for external API calls
- Always validate user authentication first
- Return minimal data needed by the client
- Use helper functions for repeated auth/validation logic

```typescript
// Good
export const getDailyLog = query({
  args: { challengeId: v.id('challenges'), dayNumber: v.number() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx); // Throws if not authenticated

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.userId !== user.id) {
      throw new Error('Challenge not found');
    }

    return ctx.db
      .query('dailyLogs')
      .withIndex('by_challenge_day', (q) =>
        q.eq('challengeId', args.challengeId).eq('dayNumber', args.dayNumber)
      )
      .unique();
  },
});
```

### Real-time Subscriptions
- Prefer reactive queries over polling
- Use `useQuery` hook for automatic subscriptions
- Invalidation happens automatically - don't manually refetch

---

## Component Guidelines

### React Components
- Functional components only (no class components)
- Use named exports for components
- Colocate component-specific hooks and utilities
- Props interfaces should be named `{ComponentName}Props`

```typescript
// Good
interface DailyLogCardProps {
  log: DailyLog;
  onComplete: () => void;
  isEditable?: boolean;
}

export function DailyLogCard({ log, onComplete, isEditable = true }: DailyLogCardProps) {
  // ...
}
```

### State Management
- Use Convex for server state (no Redux/Zustand needed)
- Use React state for UI-only state (modals, forms, etc.)
- Use URL state for shareable state (filters, selected day, etc.)

### Forms
- Use React Hook Form for complex forms
- Validate with Zod schemas (shared with backend)
- Show inline validation errors
- Disable submit button while submitting

---

## 75 HARD Business Logic

### Challenge Rules (MUST be enforced)
1. Two 45-minute workouts per day (one MUST be outdoor)
2. Follow a diet (no specific diet required, but no cheat meals)
3. No alcohol
4. Drink 1 gallon (128 oz) of water
5. Read 10 pages of non-fiction
6. Take a progress photo

### Failure Conditions
- Missing ANY requirement resets the challenge to Day 0
- Challenge can only be restarted, not resumed
- Track `failedOn` day number for analytics

### Day Boundaries
- Day resets at midnight in user's local timezone
- Store dates as ISO strings in UTC
- Convert to local timezone for display
- A day is "complete" only when ALL requirements are logged

```typescript
// Constants
export const CHALLENGE_DAYS = 75;
export const WATER_GOAL_OZ = 128;
export const WORKOUT_DURATION_MIN = 45;
export const WORKOUTS_PER_DAY = 2;
export const READING_PAGES = 10;
```

### Progress Photo Storage
- Use Convex file storage for photos
- Generate thumbnails for feed display
- Original photos for user's personal gallery
- Respect visibility settings (private/friends/public)

---

## Health Device Integration

### Supported Devices
- Apple HealthKit (via react-native-health)
- Oura Ring (OAuth + REST API)
- WHOOP (OAuth + REST API)

### Data Normalization
Always normalize external workout data to our schema:

```typescript
interface NormalizedWorkout {
  source: 'apple_health' | 'oura' | 'whoop' | 'manual';
  externalId?: string;
  type: WorkoutType;
  startTime: string; // ISO
  endTime: string; // ISO
  durationMinutes: number;
  calories?: number;
  isOutdoor: boolean; // Infer from workout type if not explicit
}
```

### Duplicate Detection
- Check `externalId` before importing workouts
- Allow manual workouts even if device workouts exist
- User can choose which workout counts toward their 2 daily

---

## Social Features

### Privacy Levels
- `private`: Only the user can see
- `friends`: User's accepted friends can see
- `public`: Anyone can see (future: public leaderboards)

### Activity Feed
- Show friend activity in real-time (Convex subscriptions)
- Types: `day_completed`, `challenge_started`, `challenge_completed`, `milestone`
- Milestones: Day 7, 14, 21, 30, 45, 60, 75

### Friend System
- Mutual friendship (both must accept)
- Friend requests stored with status
- Block functionality (future)

---

## Error Handling

### Client-Side
- Use error boundaries for unexpected errors
- Show user-friendly messages for known error states
- Log errors to console in development

### Convex Functions
- Throw `ConvexError` for user-facing errors
- Include error codes for client-side handling
- Never expose internal details in error messages

```typescript
// Good
if (!challenge) {
  throw new ConvexError({
    code: 'NOT_FOUND',
    message: 'Challenge not found',
  });
}
```

---

## Performance

### Convex Queries
- Use indexes for all filtered queries
- Paginate large result sets
- Avoid N+1 queries - batch related data

### Images
- Lazy load images below the fold
- Use appropriate image sizes (thumbnails in feeds)
- Compress progress photos before upload

### Mobile
- Enable Hermes engine
- Use `React.memo` for expensive list items
- Virtualize long lists (FlatList/FlashList)

---

## Security

### Authentication
- All Convex functions must verify auth (except public queries)
- Use Clerk's `userId` as the source of truth
- Never trust client-provided user IDs

### Data Access
- Users can only access their own data
- Friend data access requires mutual friendship verification
- Public data still requires visibility check

### Sensitive Data
- Never log passwords, tokens, or PII
- Health data is private by default
- Progress photos require explicit sharing consent

---

## Git Conventions

### Branch Naming
- `feature/add-workout-timer`
- `fix/water-tracking-timezone`
- `chore/upgrade-convex`

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Keep subject line under 72 characters
- Reference issue numbers when applicable

```
feat: add Apple HealthKit workout import

- Integrate react-native-health for HealthKit access
- Normalize workout data to internal schema
- Add duplicate detection by external ID

Closes #42
```

### Pull Requests
- Keep PRs focused on single features/fixes
- Include screenshots for UI changes
- Update CLAUDE.md if conventions change

---

## Environment Variables

### Required
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# 21st.dev Magic MCP
TWENTYFIRST_DEV_API_KEY=

# Health APIs (mobile only)
OURA_CLIENT_ID=
OURA_CLIENT_SECRET=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
```

---

## Quick Reference

### Starting Development
```bash
pnpm install
pnpm dev          # Starts web + Convex
pnpm dev:mobile   # Starts Expo
```

### Common Commands
```bash
pnpm convex dev           # Run Convex locally
pnpm convex deploy        # Deploy Convex to production
pnpm lint                 # Run ESLint
pnpm typecheck            # Run TypeScript checks
```

### MCP Commands in Claude Code
```bash
/mcp                      # Check MCP server status
# Then use natural language:
# "use shadcn to install the calendar component"
# "/ui create a beautiful progress tracker card"
```

### Useful Links
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [21st.dev](https://21st.dev)
- [75 HARD Official Rules](https://andyfrisella.com/pages/75hard-info)
