# 75 Proof — Product Plan

## Vision

75 Proof is an open-source, privacy-first habit tracker built around the 75 HARD challenge. It's designed to help people build discipline and improve their health — without exploiting their data, attention, or wallet. The app should feel fun, celebratory, and empowering, not punitive.

---

## 1. Pricing Strategy

### Philosophy
The goal is to make 75 Proof accessible to everyone. Cost should never be a barrier to building discipline.

### Approach
- **Free by default.** No trials, no paywalls, no premium tiers. Every feature is available to every user.
- **If server costs grow**, introduce an optional $1/month contribution — framed as "keep the lights on," not a subscription upsell.
- **Alternative consideration:** Charge a small fee ($1-3) specifically to increase user commitment. Research shows that even a tiny monetary investment increases follow-through. This could be positioned as "put your money where your mouth is."
- **Never:** Sell user data, show ads, or gate features behind payment.

### Decision needed
- [ ] Free forever with optional donation?
- [ ] Small upfront fee for commitment psychology?
- [ ] Free tier + $1/month if infrastructure costs warrant it?

---

## 2. Custom Habits System

### Core Concept
75 HARD has a fixed set of rules, but 75 Proof should support **any 75-day challenge**. Users should be able to add, remove, and customize their daily habits.

### Default Habits (75 HARD Standard)
1. Two 45-minute workouts (one outdoor)
2. Follow a diet (no alcohol, no cheat meals)
3. Drink 128 oz (1 gallon) of water
4. Read 10 pages of non-fiction
5. Take a progress photo
6. No missed days (fail = restart from Day 1)

### Custom Habit Features
- **Add custom habits:** "Meditate 10 minutes," "Journal 500 words," "Cold shower," etc.
- **Remove default habits:** If someone is doing a modified version, let them.
- **Set habit parameters:** Duration, quantity, frequency.

### Hard Rules vs Soft Rules

| | Hard Rules | Soft Rules |
|---|---|---|
| **What happens on miss** | Challenge resets to Day 1 | Day still counts, but marked incomplete |
| **Use case** | Core 75 HARD protocol | Supplementary habits or gentler challenges |
| **Visual indicator** | Red/strict badge | Yellow/flex badge |
| **Default** | All 75 HARD tasks are hard rules | Custom-added habits default to soft |

Users can toggle any habit between hard and soft. This lets people run the strict 75 HARD or create their own "75 Medium" or "75 Easy" variant.

### Data Model

```
habit {
  id: string
  name: string
  description: string
  type: "hard" | "soft"
  trackingType: "boolean" | "quantity" | "duration"
  target?: number          // e.g., 128 for water oz, 10 for pages
  unit?: string            // e.g., "oz", "pages", "minutes"
  isDefault: boolean       // part of standard 75 HARD
  createdBy: "system" | "user"
}
```

---

## 3. Health & Safety Warnings

### Why This Matters
75 HARD is a demanding physical and mental challenge. It's not appropriate for everyone without medical guidance. 75 Proof has a responsibility to inform users about potential risks.

### Implementation
Display a clear, non-dismissive health advisory during onboarding and in settings. This is NOT a liability disclaimer — it's genuine care for users.

### Who Should Consult a Doctor First

**Physical Health Conditions:**
- Heart disease or history of heart attack/stroke
- High blood pressure (hypertension)
- Diabetes (Type 1 or Type 2)
- Asthma or chronic respiratory conditions
- Joint problems, arthritis, or recent injuries
- Obesity (BMI > 30) — sudden intense exercise can be risky
- Pregnancy or postpartum (within 6 months)
- Recent surgery (within 3 months)
- Chronic pain conditions (fibromyalgia, etc.)
- Autoimmune disorders

**Mental Health Conditions:**
- Eating disorders (current or history) — strict dieting rules can trigger relapse
- Severe anxiety or OCD — rigid daily rules can become compulsive
- Depression — while exercise helps, the all-or-nothing reset mechanic can be harmful
- Body dysmorphia — daily progress photos can exacerbate symptoms

**Medications:**
- Blood pressure medication
- Blood thinners
- Insulin or diabetes medication
- Psychiatric medication (dosage may need adjustment with lifestyle changes)
- Beta-blockers (affect heart rate during exercise)

**Age Considerations:**
- Under 16: Not recommended without parental and medical guidance
- Over 60: Should consult doctor, especially for outdoor exercise in extreme weather
- Anyone who hasn't exercised regularly in the past 6 months

**Environmental Risks:**
- Outdoor workouts in extreme heat (>95°F / 35°C) or cold (<20°F / -7°C)
- Exercising at high altitude without acclimatization
- Areas with poor air quality

### UI Treatment
- Show during onboarding as a caring, well-designed advisory (not a scary legal wall)
- Include a "I've reviewed this with my doctor" optional acknowledgment
- Make it accessible from settings at any time
- Don't block the user — inform, don't gatekeep
- Soft rules can be suggested for users who indicate health concerns

---

## 4. Data Ownership & Transparency

### Philosophy
Users own their data. Period. We are stewards, not owners.

### Data Policy (Plain English)

**What we store:**
- Account info (email, name — via Clerk)
- Challenge progress (daily logs, streaks, completion status)
- Habit configurations
- Progress photos (if uploaded)
- Friend connections and social activity

**What we DON'T do:**
- Sell data to third parties
- Show targeted ads
- Share data with health insurance companies
- Use data for AI training without explicit consent
- Track behavior outside the app

**What we DON'T store:**
- Location data (outdoor workouts are self-reported)
- Health device raw data (we only store normalized workout summaries)
- Browsing history or device fingerprints

### User Controls

**CSV Export:**
- One-click export of ALL user data as CSV
- Includes: daily logs, habit history, challenge stats, friend list
- Format should be human-readable and importable into spreadsheets
- Available at any time from settings

**Permanent Deletion:**
- "Delete my account and all data" button in settings
- Confirmation step with clear explanation of what will be deleted
- Actually delete everything — no "soft delete" retention for 90 days
- Progress photos are permanently removed from storage
- Process completes within 24 hours
- Send confirmation email when deletion is complete

**Data Portability:**
- Export in standard formats (CSV, JSON)
- Include data schema documentation so users can understand the export
- Eventually: import from other habit trackers

### Implementation
- Add `/settings/data` page with export and deletion options
- Convex action for data export (query all user tables, format as CSV/JSON)
- Convex action for account deletion (cascade delete across all tables + file storage)
- Clear, simple privacy policy page (not legalese)

---

## 5. Open Source

### License
MIT License — permissive, community-friendly, allows commercial forks.

### Repository Structure
- Public GitHub repo
- Clear README with setup instructions
- `CONTRIBUTING.md` with contribution guidelines
- `CODE_OF_CONDUCT.md`
- Issue templates (bug report, feature request, design proposal)
- PR template

### Contribution Guidelines
- Fork → Branch → PR workflow
- All PRs require at least one review
- Code must pass lint + type checks
- UI changes must include screenshots
- New features should include tests where applicable
- Follow existing code conventions (see CLAUDE.md)

### Roadmap (Public GitHub Project Board)

**Phase 1 — Foundation (Current)**
- [x] Landing page design
- [x] Cloudflare Workers deployment
- [ ] Core authentication flow (Clerk)
- [ ] Basic dashboard UI
- [ ] Daily check-in card
- [ ] Standard 75 HARD habit tracking
- [ ] Progress photo upload

**Phase 2 — Custom Habits**
- [ ] Custom habit creation UI
- [ ] Hard vs soft rule system
- [ ] Challenge templates ("75 Hard," "75 Medium," "Custom")
- [ ] Habit parameter configuration (duration, quantity, boolean)

**Phase 3 — Social**
- [ ] Friend system (add, accept, block)
- [ ] Activity feed (real-time via Convex)
- [ ] Milestone celebrations (Day 7, 14, 21, 30, 45, 60, 75)
- [ ] Shared challenge groups

**Phase 4 — Health Integration**
- [ ] Apple HealthKit integration
- [ ] Oura Ring API
- [ ] WHOOP API
- [ ] Auto-import workouts with duplicate detection
- [ ] Health advisory during onboarding

**Phase 5 — Gamification (inspired by V13 arcade design)**
- [ ] XP system for completing daily tasks
- [ ] Level progression with visual level bar
- [ ] Streak multipliers
- [ ] Achievement badges / milestones
- [ ] Optional leaderboards (friends only by default)

**Phase 6 — Data & Privacy**
- [ ] CSV/JSON data export
- [ ] Account deletion flow
- [ ] Plain-english privacy policy page
- [ ] Data portability documentation

**Phase 7 — Polish & Scale**
- [ ] React Native mobile app (Expo)
- [ ] Push notifications (opt-in only)
- [ ] Offline support
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)

### GitHub Issues
Create issues for each roadmap item. Use labels:
- `feature` — New functionality
- `bug` — Something broken
- `design` — UI/UX work
- `docs` — Documentation
- `good first issue` — Approachable for new contributors
- `help wanted` — Community contributions welcome
- `health-safety` — Related to user health and safety

---

## 6. Gamification Design (from V13 inspiration)

### Core Mechanics
Inspired by the V13 retro arcade landing page, the app should have lightweight gamification that makes daily tracking feel rewarding, not punitive.

**XP System:**
- Earn XP for each completed habit
- Bonus XP for completing all habits in a day
- Streak multiplier (consecutive days increase XP rate)
- XP resets with challenge reset (hard rules) — this is the punishment

**Levels:**
- Visual level bar showing progress
- Level thresholds tied to total XP
- Level names could be fun/thematic (e.g., "Rookie," "Grinder," "Machine," "Legend")

**Achievements:**
- Day milestones: 7, 14, 21, 30, 45, 60, 75
- Streak achievements: 7-day streak, 30-day streak, etc.
- Habit-specific: "Hydration Master" (30 days of full water), "Bookworm" (750 pages read)
- Social: "Accountability Partner" (added a friend), "Squad Goals" (3+ friends active)

**Design Principles:**
- Gamification should CELEBRATE, not PUNISH
- Keep it optional — users who don't want it can hide gamification elements
- No comparison-based mechanics that could feel toxic (no public leaderboards by default)
- Achievements should feel earned, not exploitative

---

## 7. Design Language

### Homepage: V14 "Tropical Zine"
- Collage aesthetic, tilted cards, sticker tags
- Bold DM Sans headings, Space Mono for labels
- Color palette: cream #FFFBF0, coral #FF6154, teal #4ECDC4, yellow #FFE66D, purple #A78BFA
- Newspaper clipping section for health research

### App Design: Inspired by V13 "Retro Arcade"
- Gamification elements with pixel-art accents
- XP bars, level indicators, achievement badges
- Dark mode primary with vibrant accent colors
- Satisfying micro-animations for task completion
- Mix the arcade energy with the zine's visual flair

### Shared Principles
- Mobile-first responsive design
- Dark mode support throughout
- Accessibility (WCAG 2.1 AA minimum)
- Reduced motion support
- Fun > Serious (but not childish)

---

## 8. Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Database | Convex | Real-time subscriptions, serverless, typed |
| Auth | Clerk | Fast to implement, good free tier |
| Hosting | Cloudflare Workers | Edge deployment, fast globally |
| UI | shadcn/ui + Tailwind | Accessible, customizable, maintainable |
| Mobile | React Native (Expo) | Shared logic with web, native feel |
| License | MIT | Maximum community adoption |
| State | Convex (server) + React (UI) | No Redux needed |
| Forms | React Hook Form + Zod | Shared validation with backend |

---

*This is a living document. Update it as decisions are made and the product evolves.*
