export type RoutineCategory =
  | "fitness"
  | "skill-building"
  | "productivity"
  | "personal-development";

export interface PopularRoutineSeed {
  slug: string;
  title: string;
  category: RoutineCategory;
  summary: string;
  whatItIs: string;
  duration: string;
  trackingChecklist: string[];
  whyItMatters: string;
  caveat?: string;
  tags: string[];
  sourceUrl?: string;
}

export const POPULAR_ROUTINES_SEED: PopularRoutineSeed[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Fitness & physical health
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "75-hard-challenge",
    title: "75 Hard Challenge",
    category: "fitness",
    summary:
      "Andy Frisella's 75-day all-or-nothing program — miss anything and you restart Day 1. The dominant hardcore challenge of the decade.",
    whatItIs:
      "The dominant hardcore challenge of the decade. Andy Frisella's 75-day all-or-nothing program: miss anything, restart Day 1. Two daily 45-minute workouts (one outdoors), a gallon of water, a strict diet with no cheats or alcohol, 10 pages of nonfiction, and a daily progress photo.",
    duration: "75 days",
    trackingChecklist: [
      "Workout 1 (45 min)",
      "Workout 2 (45 min, outdoors)",
      "Gallon of water",
      "Diet followed (no cheats, no alcohol)",
      "10 pages nonfiction",
      "Progress photo",
    ],
    whyItMatters:
      "#75Hard has surpassed 1B TikTok views; r/75Hard has 200K+ members.",
    caveat:
      "Cleveland Clinic and CNN (March 2026) flag overtraining and eating-disorder risk.",
    tags: ["hardcore", "strict", "75-day", "tiktok-trending", "mental-toughness", "fitness"],
  },
  {
    slug: "75-soft-challenge",
    title: "75 Soft Challenge",
    category: "fitness",
    summary:
      "Mental-health-friendly version of 75 Hard: one daily workout, 3L water, balanced eating, 10 pages reading. Skipping a day doesn't reset.",
    whatItIs:
      "The mental-health-friendly version: one 45-min workout daily (rest days OK), 3L water, eat well, limit alcohol to social occasions, 10 pages reading. Skipping a day doesn't reset.",
    duration: "75 days",
    trackingChecklist: [
      "45-min workout",
      "3L water",
      "Balanced meals",
      "≤3 drinks/wk",
      "10 pages read",
      "(Optional) meditation",
    ],
    whyItMatters:
      "Recommended by Cleveland Clinic as the safer entry point compared to 75 Hard.",
    tags: ["gentle", "beginner-friendly", "75-day", "fitness", "mental-toughness"],
  },
  {
    slug: "75-medium-challenge",
    title: "75 Medium Challenge",
    category: "fitness",
    summary:
      "Real-life hybrid for working parents: one 45-min workout, half-bodyweight in oz of water, 90% diet, 10 pages, photo, weekly outdoor workout.",
    whatItIs:
      "The 'real-life' hybrid for working parents: one 45-min workout, half-bodyweight oz of water, diet 90% compliant, 10 pages, photo, one outdoor workout per week.",
    duration: "75 days",
    trackingChecklist: [
      "Workout",
      "Water target",
      "Diet 90%",
      "Read 10 pages",
      "Progress photo",
      "Outdoor workout (weekly)",
    ],
    whyItMatters:
      "A balanced middle ground between 75 Hard's all-or-nothing rigor and 75 Soft's flexibility, popular with working parents and those wanting structure without burnout.",
    tags: ["75-day", "fitness", "beginner-friendly", "time-bound"],
  },
  {
    slug: "murph-memorial-day-hero-wod",
    title: "Murph (Memorial Day Hero WOD)",
    category: "fitness",
    summary:
      "1-mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1-mile run — ideally weighted. The annual CrossFit Memorial Day benchmark.",
    whatItIs:
      "1-mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1-mile run — ideally weighted vest. Performed every Memorial Day by hundreds of CrossFit affiliates.",
    duration: "Annual / one-time benchmark",
    trackingChecklist: [
      "Run 1",
      "100 pull-ups",
      "200 push-ups",
      "300 squats",
      "Run 2",
      "Vest worn",
    ],
    whyItMatters:
      "The Murph Challenge fundraises millions annually and is a cultural CrossFit benchmark.",
    tags: ["hardcore", "crossfit", "strength", "cardio", "fitness", "time-bound"],
  },
  {
    slug: "david-goggins-4x4x48",
    title: "David Goggins 4x4x48",
    category: "fitness",
    summary:
      "Run 4 miles every 4 hours for 48 hours — 12 runs / 48 miles total. The ultimate test of grit popularized in Can't Hurt Me.",
    whatItIs:
      "Run 4 miles every 4 hours for 48 hours (12 runs / 48 miles). Tens of thousands attempt it annually each March, popularized in Can't Hurt Me.",
    duration: "48 hours",
    trackingChecklist: [
      "Run # (1–12)",
      "Hydration",
      "Fuel",
      "Micro-sleep",
    ],
    whyItMatters:
      "Tens of thousands attempt it annually each March; popularized in David Goggins's bestselling memoir Can't Hurt Me.",
    tags: ["hardcore", "advanced", "cardio", "mental-toughness", "fitness", "time-bound"],
  },
  {
    slug: "hyrox-training",
    title: "Hyrox training",
    category: "fitness",
    summary:
      "8 km of running alternated with 8 functional fitness stations. The fastest-growing fitness trend of 2025–2026.",
    whatItIs:
      "The fastest-growing fitness trend of 2025–2026: 8 km of running alternated with 8 functional stations (ski erg, sled, burpee broad jumps, row, farmer's carry, sandbag lunges, wall balls).",
    duration: "8–16 week training blocks",
    trackingChecklist: [
      "Run intervals",
      "Functional/strength",
      "Sled or erg work",
      "Race-pace simulation",
      "Mobility",
    ],
    whyItMatters:
      "5,000+ affiliated gyms; 550,000+ raced in 2025.",
    tags: ["fitness", "cardio", "strength", "advanced", "time-bound"],
  },
  {
    slug: "12-3-30-treadmill",
    title: "12-3-30 treadmill",
    category: "fitness",
    summary:
      "Walk at 12% incline, 3 mph, for 30 minutes. The viral TikTok cardio routine validated by a 2025 university study.",
    whatItIs:
      "Walk at 12% incline, 3 mph, for 30 min. Created by Lauren Giraldo and validated for fat oxidation by UNLV's 2025 ACE-funded study.",
    duration: "Ongoing 3–5x weekly",
    trackingChecklist: [
      "30-min session",
      "No handrails",
      "Steps logged",
    ],
    whyItMatters:
      "#12330workout has 400M+ TikTok views; UNLV's 2025 ACE-funded study validated it for fat oxidation.",
    tags: ["cardio", "tiktok-trending", "weight-loss", "beginner-friendly", "fitness"],
  },
  {
    slug: "hot-girl-walk-10k-steps",
    title: "Hot Girl Walk / 10K steps",
    category: "fitness",
    summary:
      "Mia Lind's 4-mile mindfulness walk focused on goals, gratitude, and confidence. Health gains plateau around 7–8K but continue to ~10–12K steps.",
    whatItIs:
      "Mia Lind's 4-mile mindfulness walk focused on goals, gratitude, and confidence. Health gains plateau around 7–8K steps but continue to ~10–12K.",
    duration: "Ongoing daily",
    trackingChecklist: [
      "10,000 steps",
      "4-mile outdoor walk",
      "Gratitude reflection",
      "Phone-free moments",
    ],
    whyItMatters:
      "Hugely popular on TikTok as an accessible, mental-health-friendly daily movement habit; the gateway routine for many starting a fitness journey.",
    tags: ["cardio", "mindfulness", "tiktok-trending", "ongoing-habit", "beginner-friendly"],
  },
  {
    slug: "rucking-weighted-vest-walking",
    title: "Rucking / weighted-vest walking",
    category: "fitness",
    summary:
      "Walking with a 10–40 lb pack or vest. Weighted-vest sales jumped 50%+ to $27M in the year ending May 2025.",
    whatItIs:
      "Walking with a 10–40 lb pack or vest. A low-impact, high-return form of cardio and strength training driven by GoRuck and Mary Claire Haver's menopause and bone-density advocacy.",
    duration: "2–5x weekly, ongoing",
    trackingChecklist: [
      "Ruck completed (distance/time)",
      "Vest weight",
      "Posture",
      "Recovery",
    ],
    whyItMatters:
      "Weighted-vest sales jumped 50%+ to $27M in the year ending May 2025 (Circana); driven by GoRuck and Mary Claire Haver's menopause/bone-density advocacy.",
    tags: ["cardio", "strength", "longevity", "ongoing-habit", "fitness"],
  },
  {
    slug: "zone-2-cardio-huberman-attia",
    title: "Zone 2 cardio (Huberman/Attia protocol)",
    category: "fitness",
    summary:
      "Sustained low-to-moderate cardio (60–70% max HR) for 150–200 min/week. Foundational to the longevity movement.",
    whatItIs:
      "Sustained low-to-moderate cardio at 60–70% of max heart rate for 150–200 minutes per week. Foundational to the longevity movement championed by Andrew Huberman and Peter Attia.",
    duration: "Ongoing weekly target",
    trackingChecklist: [
      "Zone 2 session",
      "HR in target range",
      "Weekly minutes total",
    ],
    whyItMatters:
      "Foundational to the longevity movement and widely cited by Andrew Huberman and Peter Attia as the most efficient cardio investment for healthspan.",
    tags: ["cardio", "longevity", "ongoing-habit", "fitness"],
  },
  {
    slug: "ppl-push-pull-legs-split",
    title: "PPL (Push/Pull/Legs) split",
    category: "fitness",
    summary:
      "Six-day-per-week hypertrophy split — Reddit's default intermediate program for over a decade.",
    whatItIs:
      "Six-day-per-week hypertrophy split — Reddit's default intermediate program for over a decade, paired in 2025–2026 with daily 5g creatine and the ~1g protein-per-pound rule.",
    duration: "Ongoing weekly",
    trackingChecklist: [
      "Push",
      "Pull",
      "Legs",
      "Hit protein target",
      "Progressive overload logged",
      "Creatine taken",
    ],
    whyItMatters:
      "Reddit's default intermediate program for over a decade, embraced by lifters across r/fitness and r/bodybuilding.",
    tags: ["strength", "advanced", "ongoing-habit", "fitness", "nutrition"],
  },
  {
    slug: "crossfit-daily-wod",
    title: "CrossFit daily WOD",
    category: "fitness",
    summary:
      "Daily class-based WOD combining lifting, gymnastics, and conditioning. ~13,000 affiliate gyms globally.",
    whatItIs:
      "Daily class-based Workout of the Day combining lifting, gymnastics, and conditioning. Murph, Fran, and Cindy are cultural benchmarks.",
    duration: "5x weekly, ongoing",
    trackingChecklist: [
      "Class attended",
      "WOD score",
      "Mobility",
      "Skill work",
    ],
    whyItMatters:
      "~13,000 affiliate gyms globally; Murph, Fran, and Cindy are cultural benchmarks.",
    tags: ["crossfit", "strength", "cardio", "advanced", "ongoing-habit", "fitness"],
  },
  {
    slug: "couch-to-5k-c25k",
    title: "Couch to 5K (C25K)",
    category: "fitness",
    summary:
      "NHS-developed 9-week walk-to-run progression. The on-ramp to running per r/running and r/C25K.",
    whatItIs:
      "NHS-developed 9-week walk-to-run progression. The classic on-ramp to running, recommended on r/running and r/C25K.",
    duration: "9 weeks (3 runs/week)",
    trackingChecklist: [
      "Run/walk session",
      "Warm-up + cool-down",
      "Week/Day complete",
    ],
    whyItMatters:
      "The on-ramp to running per r/running and r/C25K — a proven beginner-friendly progression backed by the UK's NHS.",
    tags: ["beginner-friendly", "cardio", "time-bound", "fitness"],
  },
  {
    slug: "yoga-with-adriene-30-day",
    title: "Yoga With Adriene 30-day",
    category: "fitness",
    summary:
      "Adriene Mishler's free January YouTube series — a global ritual on a channel with 13M+ subscribers.",
    whatItIs:
      "Adriene Mishler's free January YouTube series — global ritual on a channel with 13M+ subscribers.",
    duration: "30 days",
    trackingChecklist: [
      "Day X video",
      "Mat time",
      "Breath focus",
    ],
    whyItMatters:
      "A global January ritual; Adriene's YouTube channel has 13M+ subscribers and the annual series draws hundreds of thousands of participants.",
    tags: ["mobility", "mindfulness", "beginner-friendly", "time-bound", "fitness"],
  },
  {
    slug: "30-day-push-up-plank-squat",
    title: "30-day push-up / plank / squat / 100 push-ups",
    category: "fitness",
    summary:
      "Progressive bodyweight ramps (e.g., 20 → 100 push-ups, plank 20s → 5 min). Surged again on TikTok 2025.",
    whatItIs:
      "Progressive bodyweight ramps (e.g., 20 → 100 push-ups, plank 20s → 5 min). Surged again on TikTok 2025 alongside the Dead Hang Challenge.",
    duration: "30 days",
    trackingChecklist: [
      "Push-ups (target reps)",
      "Plank time",
      "Squats",
      "Rest day",
    ],
    whyItMatters:
      "Surged again on TikTok 2025 alongside the Dead Hang Challenge (#deadhang has 120M+ views).",
    tags: ["strength", "beginner-friendly", "time-bound", "tiktok-trending", "fitness"],
  },
  {
    slug: "wim-hof-method-20-day-cold-plunge",
    title: "Wim Hof Method / 20-day cold plunge",
    category: "fitness",
    summary:
      "Three rounds of breathwork (30 deep breaths + retention) plus progressive cold exposure — 30 sec building to 2+ min.",
    whatItIs:
      "Three rounds of breathwork (30 deep breaths + retention) plus progressive cold exposure (30 sec → 2+ min). Huberman recommends 11 min/week of cold for a ~250% dopamine spike.",
    duration: "20-day onboarding → daily ongoing",
    trackingChecklist: [
      "WHM breathing",
      "Cold shower/plunge (seconds)",
      "Mindset moment",
    ],
    whyItMatters:
      "Huberman recommends 11 min/week of cold exposure for a ~250% dopamine spike; the WHM has built a global community of practitioners chasing resilience and recovery benefits.",
    tags: ["cold-exposure", "mental-toughness", "longevity", "mindfulness", "fitness"],
  },
  {
    slug: "sauna-protocol-huberman-heat",
    title: "Sauna protocol (Huberman heat-exposure)",
    category: "fitness",
    summary:
      "2–3 sessions per week at 80–100°C for 15–30 min, often paired with cold for contrast therapy. The #1 longevity-recovery protocol of 2025–2026.",
    whatItIs:
      "2–3 sauna sessions per week at 80–100°C for 15–30 minutes, often paired with cold for contrast therapy. The #1 longevity-recovery protocol of 2025–2026.",
    duration: "~1 hr/week ongoing",
    trackingChecklist: [
      "Sauna session",
      "Cold contrast",
      "Hydration",
      "Weekly total",
    ],
    whyItMatters:
      "Cited as the #1 longevity-recovery protocol of 2025–2026, drawing on Laukkanen's Finnish mortality studies showing major cardiovascular and all-cause mortality benefits.",
    tags: ["sauna", "longevity", "cold-exposure", "ongoing-habit", "fitness"],
  },
  {
    slug: "intermittent-fasting-16-8-omad-5-2",
    title: "Intermittent fasting (16:8 / OMAD / 5:2)",
    category: "fitness",
    summary:
      "Time-restricted eating; 16:8 dominates with ~40% of practitioners. r/intermittentfasting has 1.7M+ members.",
    whatItIs:
      "Time-restricted eating with three popular protocols: 16:8 (16-hour fast, 8-hour eating window), OMAD (one meal a day), and 5:2 (two low-calorie days per week). 16:8 dominates with ~40% of practitioners.",
    duration: "Ongoing",
    trackingChecklist: [
      "Eating window respected",
      "Fast length hit",
      "Hydration during fast",
      "Protein in window",
    ],
    whyItMatters:
      "r/intermittentfasting has 1.7M+ members, and 16:8 has become a mainstream nutrition strategy for weight management and metabolic health.",
    tags: ["nutrition", "weight-loss", "ongoing-habit", "longevity", "fitness"],
  },
  {
    slug: "whole30",
    title: "Whole30",
    category: "fitness",
    summary:
      "30-day elimination of sugar, alcohol, grains, legumes, dairy, processed foods, plus 10-day reintroduction.",
    whatItIs:
      "30-day elimination of sugar, alcohol, grains, legumes, dairy, processed foods, plus structured 10-day reintroduction. Created by Melissa Urban (2009).",
    duration: "30 days + 10-day reintro",
    trackingChecklist: [
      "Compliant meals (B/L/D)",
      "No off-plan foods",
      "Hydration",
      "Day X / 30",
    ],
    whyItMatters:
      "Created by Melissa Urban in 2009; the January 5, 2026 cohort runs strong and remains a defining elimination-style nutrition reset.",
    tags: ["nutrition", "strict", "time-bound", "weight-loss", "fitness"],
  },
  {
    slug: "dry-january-sober-october-no-sugar",
    title: "Dry January / Sober October / no-sugar",
    category: "fitness",
    summary:
      "Month-long abstinence challenges. Drove US drinking rates to a 96-year low (Harvard Gazette, October 2025).",
    whatItIs:
      "Month-long abstinence challenges from alcohol or added sugar, typically run annually. The non-alcoholic beverage category now makes up ~85% of nonalcoholic adult drinks share.",
    duration: "30–31 days, typically annual",
    trackingChecklist: [
      "No alcohol",
      "No added sugar",
      "Cravings logged",
      "Day X / 31",
    ],
    whyItMatters:
      "Drove US drinking rates to a 96-year low (Harvard Gazette, October 2025). Tom Holland's BERO non-alcoholic line launched late 2024; NA beverages now ~85% of nonalcoholic adult drinks share.",
    tags: ["sober-curious", "nutrition", "time-bound", "tiktok-trending", "fitness"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Skill-building / mastery routines
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "100-days-of-code",
    title: "#100DaysOfCode",
    category: "skill-building",
    summary:
      "Code at least 1 hour daily for 100 days and log progress publicly. The foundational coding challenge for self-taught developers.",
    whatItIs:
      "Code ≥1 hour daily for 100 days, log progress publicly. Created by Alexander Kallaway; the foundational coding challenge for self-taught devs, with spinoffs like Angela Yu's 100 Days of Python.",
    duration: "100 days",
    trackingChecklist: [
      "Coded ≥1 hr",
      "GitHub commit",
      "Public progress post",
      "Log updated",
    ],
    whyItMatters:
      "Created by Alexander Kallaway; the foundational coding challenge for self-taught devs, with spinoffs like Angela Yu's 100 Days of Python (1M+ Udemy students).",
    tags: ["coding", "time-bound", "100-day", "skill-building"],
  },
  {
    slug: "leetcode-daily-challenge",
    title: "LeetCode daily challenge",
    category: "skill-building",
    summary:
      "One curated interview problem every 24 hours with monthly badges. The default FAANG prep routine.",
    whatItIs:
      "One curated coding interview problem every 24 hours with monthly badges. Default FAANG prep; users routinely report 300–700+ day streaks (Time Travel Tickets recover misses).",
    duration: "Ongoing daily",
    trackingChecklist: [
      "Daily problem solved",
      "Mistakes reviewed",
      "Solution archived",
      "Company tags reviewed",
    ],
    whyItMatters:
      "Default FAANG prep; users routinely report 300–700+ day streaks (Time Travel Tickets recover misses).",
    tags: ["coding", "ongoing-habit", "skill-building", "advanced"],
  },
  {
    slug: "advent-of-code",
    title: "Advent of Code",
    category: "skill-building",
    summary:
      "Eric Wastl's annual December puzzle calendar — now 12 puzzles (Dec 1–12), not 25, as of 2025.",
    whatItIs:
      "Eric Wastl's annual December calendar of programming puzzles — as of 2025 it runs Dec 1–12 (12 puzzles, not 25), and the global leaderboard has been retired.",
    duration: "~12 days each December",
    trackingChecklist: [
      "Part 1",
      "Part 2",
      "GitHub push",
      "Private leaderboard",
    ],
    whyItMatters:
      "1M+ registered users; a beloved annual ritual for developers worldwide despite the 2025 reduction in scope.",
    tags: ["coding", "time-bound", "skill-building"],
  },
  {
    slug: "codewars-katas-build-in-public",
    title: "CodeWars katas / #buildinpublic",
    category: "skill-building",
    summary:
      "Daily kata + public side-project sharing on X/LinkedIn. Central to indie hacker / SaaS founder culture.",
    whatItIs:
      "Daily coding kata combined with public side-project sharing on X/LinkedIn. Central to indie hacker and SaaS founder culture.",
    duration: "Ongoing daily",
    trackingChecklist: [
      "1 kata",
      "Feature shipped",
      "#buildinpublic post",
      "GitHub green square",
    ],
    whyItMatters:
      "Central to the indie hacker and SaaS founder culture, where building visibly accelerates feedback loops, distribution, and skill growth.",
    tags: ["coding", "ongoing-habit", "creative", "skill-building"],
  },
  {
    slug: "duolingo-daily-streak",
    title: "Duolingo daily streak",
    category: "skill-building",
    summary:
      "128M+ MAU (Q2 2025); 10M+ users with 365+ day streaks. Now spans languages, math, music, and chess.",
    whatItIs:
      "Daily lesson on the Duolingo app, now spanning languages, math, music, and chess (added 2025). The dominant gamified learning app, famous for its streak mechanic and friendly owl mascot.",
    duration: "Ongoing",
    trackingChecklist: [
      "Daily lesson",
      "3 Daily Quests",
      "Mistakes reviewed",
      "Friend Streak",
    ],
    whyItMatters:
      "128M+ MAU (Q2 2025); 10M+ users with 365+ day streaks. Now spans languages, math, music, and chess (added 2025).",
    tags: ["language-learning", "ongoing-habit", "beginner-friendly", "skill-building"],
  },
  {
    slug: "refold-immersion-anki-srs",
    title: "Refold immersion + Anki SRS",
    category: "skill-building",
    summary:
      "Daily flashcard reviews + comprehensible input (anime/dramas) + sentence mining. The de facto routine on r/LearnJapanese.",
    whatItIs:
      "Daily Anki spaced-repetition flashcard reviews combined with comprehensible input (anime, dramas) and sentence mining. Popularized by Matt vs. Japan as the de facto routine on r/LearnJapanese.",
    duration: "Ongoing (2,000+ hour fluency journey)",
    trackingChecklist: [
      "Anki reviews",
      "X new cards",
      "≥30 min active immersion",
      "≥30 min passive listening",
      "Sentence mined",
    ],
    whyItMatters:
      "The de facto routine on r/LearnJapanese; popularized by Matt vs. Japan as a self-directed path to fluency.",
    tags: ["language-learning", "advanced", "ongoing-habit", "skill-building"],
  },
  {
    slug: "pimsleur-30-min-daily",
    title: "Pimsleur 30-min daily",
    category: "skill-building",
    summary:
      "One audio lesson per day using graduated interval recall. April 2025 added gamified Challenges & Rewards plus Spotify integration.",
    whatItIs:
      "One audio lesson per day using graduated interval recall; April 2025 added gamified Challenges & Rewards plus Spotify integration. A speaking-first language method.",
    duration: "90–150 days end-to-end",
    trackingChecklist: [
      "30-min lesson",
      "Speak/Read review",
      "Quick Match",
      "Streak",
    ],
    whyItMatters:
      "A long-standing audio-first language program that excels at conversational speaking; 2025 updates added gamification and Spotify integration to modernize the experience.",
    tags: ["language-learning", "ongoing-habit", "beginner-friendly", "skill-building"],
  },
  {
    slug: "nanowrimo-write-a-novel-in-november",
    title: "NaNoWriMo / Write a Novel in November",
    category: "skill-building",
    summary:
      "50,000 words in November (~1,667/day). The original nonprofit shut down March 2025; community-run successors host the tradition.",
    whatItIs:
      "Write 50,000 words of a novel in November, averaging ~1,667 words per day. The original NaNoWriMo nonprofit shut down March 2025; community-run successors (NaNo 2.0, Discord) now host the tradition.",
    duration: "30 days",
    trackingChecklist: [
      "1,667 words today",
      "Word count updated",
      "Sprint done",
      "Weekly milestone (~11,667)",
    ],
    whyItMatters:
      "Peak participation hit 400K+ in 2022. Even after the parent nonprofit shut down in March 2025, community-run successors carry the November writing tradition forward.",
    tags: ["writing", "creative", "time-bound", "skill-building"],
  },
  {
    slug: "morning-pages-julia-cameron",
    title: "Morning Pages (Julia Cameron)",
    category: "skill-building",
    summary:
      "Three longhand stream-of-consciousness pages within 45 min of waking. The Artist's Way has sold 5M+ copies.",
    whatItIs:
      "Three longhand stream-of-consciousness pages written within 45 minutes of waking. A creativity unblocking practice from Julia Cameron's The Artist's Way.",
    duration: "12-week minimum, often ongoing",
    trackingChecklist: [
      "3 longhand pages",
      "Within 45 min of waking",
      "Weekly Artist Date",
      "Insights captured",
    ],
    whyItMatters:
      "The Artist's Way has sold 5M+ copies; cited constantly on Tim Ferriss as a foundational creativity and self-discovery practice.",
    tags: ["writing", "journaling", "creative", "mindfulness", "skill-building"],
  },
  {
    slug: "ship-30-for-30",
    title: "Ship 30 for 30",
    category: "skill-building",
    summary:
      "Dickie Bush & Nicolas Cole's challenge: publish one ~250-word Atomic Essay daily on X for 30 days.",
    whatItIs:
      "Dickie Bush & Nicolas Cole's challenge to publish one ~250-word 'Atomic Essay' daily on X for 30 days. A digital writing accelerator with 4,000+ paid alumni.",
    duration: "30 days",
    trackingChecklist: [
      "250-word essay",
      "Posted to X/LinkedIn",
      "Engaged 3 peers",
      "Engagement tracked",
    ],
    whyItMatters:
      "4,000+ paid alumni; a leading on-ramp for the digital writing economy and a proven structure for shipping public work daily.",
    tags: ["writing", "creative", "time-bound", "skill-building"],
  },
  {
    slug: "750words",
    title: "750words.com",
    category: "skill-building",
    summary:
      "Type 750 private words (≈3 pages) daily; site tracks streaks and awards 'birds.' Cult favorite among writers.",
    whatItIs:
      "Type 750 private words (≈3 pages) daily on 750words.com; the site tracks streaks and awards 'birds' for milestones. A digital cousin of Morning Pages.",
    duration: "Ongoing",
    trackingChecklist: [
      "750 words",
      "Streak maintained",
      "Reflection note",
    ],
    whyItMatters:
      "Cult favorite among writers and r/getdisciplined as a low-friction daily writing habit.",
    tags: ["writing", "journaling", "ongoing-habit", "skill-building"],
  },
  {
    slug: "inktober",
    title: "Inktober (and spinoffs)",
    category: "skill-building",
    summary:
      "Jake Parker's daily ink drawing in October following the official prompt list; 17+ years running.",
    whatItIs:
      "Jake Parker's daily ink drawing challenge during October following the official prompt list; 17+ years running. Spinoffs include MerMay, Drawtober, and Goretober.",
    duration: "31 days (October)",
    trackingChecklist: [
      "Today's prompt",
      "Used ink",
      "Posted #Inktober",
      "Engaged 3 artists",
    ],
    whyItMatters:
      "A 17+ year-old global art tradition with massive participation each October and well-loved spinoffs (MerMay, Drawtober, Goretober) throughout the year.",
    tags: ["art", "creative", "time-bound", "skill-building"],
  },
  {
    slug: "the-100-day-project",
    title: "The 100 Day Project",
    category: "skill-building",
    summary:
      "Lindsay Jean Thomson's free global creative challenge — pick one practice, do it daily for 100 days. 2026 round started Feb 22, 2026.",
    whatItIs:
      "Lindsay Jean Thomson's free global creative challenge — pick one practice, do it daily for 100 days. The 2026 round started Feb 22, 2026.",
    duration: "100 days",
    trackingChecklist: [
      "Made today's piece",
      "Photographed",
      "Posted",
      "Day # / 100",
    ],
    whyItMatters:
      "A globally followed creative challenge that turns any chosen practice into a 100-day public commitment.",
    tags: ["creative", "100-day", "time-bound", "art", "skill-building"],
  },
  {
    slug: "drawabox-250-box-challenge",
    title: "Drawabox (250 Box Challenge)",
    category: "skill-building",
    summary:
      "Free fundamentals course with daily 10–15 min warm-ups and the '50% rule' (half practice, half fun drawing).",
    whatItIs:
      "Free drawing fundamentals course with daily 10–15 min warm-ups and the '50% rule' (half practice, half fun drawing). The #1 recommendation on r/learnart.",
    duration: "Months for 250 Box; 1–2+ years full course",
    trackingChecklist: [
      "Warm-up done",
      "Lesson worked",
      "50% fun drawing",
      "Critique submitted",
    ],
    whyItMatters:
      "The #1 recommendation on r/learnart for building rigorous drawing fundamentals.",
    tags: ["art", "creative", "advanced", "skill-building"],
  },
  {
    slug: "daily-sketch-procreate-100-days-of-sketching",
    title: "Daily sketch / Procreate daily / 100 Days of Sketching",
    category: "skill-building",
    summary:
      "Keshart's '6-minute sketch' daily commitment, or any consistent sketchbook practice.",
    whatItIs:
      "Keshart's '6-minute sketch' daily commitment, or any consistent sketchbook practice — physical or digital (Procreate). A low-bar way to build a daily art habit.",
    duration: "100 days or ongoing",
    trackingChecklist: [
      "Sketched ≥6 min",
      "Sketchbook page",
      "Warm-up gestures",
      "Posted on social",
    ],
    whyItMatters:
      "A low-friction entry into daily art practice popularized by creators like Keshart, who emphasize tiny consistent doses over heroic sessions.",
    tags: ["art", "creative", "ongoing-habit", "beginner-friendly", "skill-building"],
  },
  {
    slug: "chess-com-daily-puzzle-rush-1-game",
    title: "Chess.com daily puzzle / puzzle rush + 1 game",
    category: "skill-building",
    summary:
      "Daily puzzle, Puzzle Rush, one rated game, plus opening study via Chessable. Top streak on Chess.com is 4,930+ days.",
    whatItIs:
      "A balanced chess training routine: daily puzzle, Puzzle Rush, one rated game, plus opening study via Chessable. A common stack for serious improvers on Chess.com.",
    duration: "Ongoing",
    trackingChecklist: [
      "Daily Puzzle",
      "Puzzle Rush",
      "Rapid/blitz game",
      "Losses reviewed",
      "10 min openings",
    ],
    whyItMatters:
      "Top streak on Chess.com is 4,930+ days (@Merlin-Pendragon), reflecting how daily chess study has become an intensely tracked discipline.",
    tags: ["chess", "ongoing-habit", "skill-building"],
  },
  {
    slug: "justinguitar-daily-practice",
    title: "JustinGuitar daily practice",
    category: "skill-building",
    summary:
      "20–60 min cycling through chord changes, technique, scales, ear training, songs, and improvisation.",
    whatItIs:
      "A 20–60 minute daily routine cycling through chord changes, technique, scales, ear training, songs, and improvisation. The most-used free guitar curriculum globally.",
    duration: "Ongoing (~1–2 yr course progression)",
    trackingChecklist: [
      "Warm-up / chord-perfect",
      "Technique",
      "Ear training",
      "Song",
      "Metronome",
      "Repertoire",
    ],
    whyItMatters:
      "The most-used free guitar curriculum globally; Justin Sandercoe's structured approach has launched countless self-taught guitarists.",
    tags: ["music", "ongoing-habit", "beginner-friendly", "skill-building"],
  },
  {
    slug: "classical-piano-daily-routine",
    title: "Classical piano daily routine (Hanon + Czerny + scales + Bach)",
    category: "skill-building",
    summary:
      "Universal pedagogy: scales/arpeggios, Hanon's 60 exercises, Czerny etudes, Bach, sight-reading, current repertoire.",
    whatItIs:
      "Universal classical pedagogy: scales and arpeggios, Hanon's 60 exercises, Czerny etudes, Bach (WTC, Inventions), sight-reading, and current repertoire — all in one daily session.",
    duration: "Ongoing daily (20–90+ min)",
    trackingChecklist: [
      "Scales (1 major + 1 minor)",
      "Hanon",
      "Czerny",
      "Bach",
      "Sight-reading",
      "Repertoire",
      "Metronome",
    ],
    whyItMatters:
      "The universal pedagogical structure followed by classical pianists for centuries, still the gold standard for serious technique-building.",
    tags: ["music", "advanced", "ongoing-habit", "skill-building"],
  },
  {
    slug: "functional-ear-trainer",
    title: "Functional Ear Trainer",
    category: "skill-building",
    summary:
      "5–15 min daily ear training (FET, Tenuto, EarMaster) — intervals, chord qualities, transcribing by ear.",
    whatItIs:
      "5–15 minutes of daily ear training using apps like FET, Tenuto, or EarMaster — covering intervals, chord qualities, and transcribing by ear. Standard recommendation on r/musictheory.",
    duration: "Ongoing",
    trackingChecklist: [
      "10 min FET",
      "Interval drill",
      "Chord drill",
      "1 phrase transcribed",
    ],
    whyItMatters:
      "Standard recommendation on r/musictheory and a proven path to functional musicianship for both producers and instrumentalists.",
    tags: ["music", "ongoing-habit", "skill-building"],
  },
  {
    slug: "make-100-shots-basketball-routine",
    title: "Make 100 shots basketball routine (Steph Curry-style)",
    category: "skill-building",
    summary:
      "Form-shooting from ~20 spots to 100 makes per session, plus dribbling and free throws. The reference shooting routine.",
    whatItIs:
      "Form-shooting from ~20 spots to 100 makes per session, plus dribbling combos and free-throw work. Modeled on Steph Curry's shooting development routine.",
    duration: "Ongoing daily (60–90 min)",
    trackingChecklist: [
      "Form-shooting (20 spots)",
      "100 makes",
      "Dribbling combos",
      "10-in-a-row free throws",
      "Catch-and-shoot",
    ],
    whyItMatters:
      "The reference shooting routine in basketball training, popularized by Steph Curry's well-documented practice habits.",
    tags: ["fitness", "skill-building", "advanced", "ongoing-habit"],
  },
  {
    slug: "toastmasters",
    title: "Toastmasters",
    category: "skill-building",
    summary:
      "~265,000 members across 13,833 clubs in 149 countries (2025). The #1 structured public-speaking community.",
    whatItIs:
      "The #1 structured public-speaking community, with ~265,000 members across 13,833 clubs in 149 countries (2025). Weekly meetings combine speeches, table topics, and Pathways curriculum projects.",
    duration: "Weekly ongoing; Pathways 1–3 yrs per path",
    trackingChecklist: [
      "Meeting attended",
      "Meeting role taken",
      "Pathways project worked",
      "Speech delivered",
      "Feedback logged",
    ],
    whyItMatters:
      "~265,000 members across 13,833 clubs in 149 countries (2025); the most established global community for building public-speaking skill.",
    tags: ["skill-building", "ongoing-habit", "personal-development"],
  },
  {
    slug: "monkeytype-daily-typing",
    title: "Monkeytype daily typing",
    category: "skill-building",
    summary:
      "Daily 15s/30s/60s tests tracking WPM, accuracy, consistency. Default for devs, students, and Twitch communities.",
    whatItIs:
      "Daily typing tests on Monkeytype (15s/30s/60s) tracking WPM, accuracy, and consistency. The default typing-improvement tool for developers, students, and Twitch communities.",
    duration: "Ongoing",
    trackingChecklist: [
      "≥5 tests",
      "Accuracy ≥97%",
      "PB attempt",
      "Punctuation/numbers mode",
      "Streak",
    ],
    whyItMatters:
      "The default typing-improvement tool for developers, students, and Twitch communities, with a vibrant leaderboard culture.",
    tags: ["typing", "ongoing-habit", "skill-building"],
  },
  {
    slug: "deliberate-practice-framework",
    title: "Deliberate practice framework (Ericsson / 10,000-hour rule)",
    category: "skill-building",
    summary:
      "Focused, full-attention work on a specific weakness with immediate feedback, just outside the comfort zone.",
    whatItIs:
      "The meta-framework underlying skill mastery: focused, full-attention work on a specific weakness with immediate feedback, just outside the comfort zone. From Anders Ericsson's research, popularized as the 10,000-hour rule.",
    duration: "Lifetime",
    trackingChecklist: [
      "Specific weakness identified",
      "≥1 hr deep-focus",
      "Feedback sought",
      "Tomorrow's fix logged",
      "Hours-toward-goal",
    ],
    whyItMatters:
      "The meta-framework underlying everything in skill-building, drawn from Anders Ericsson's research and popularized by Malcolm Gladwell as the 10,000-hour rule.",
    tags: ["evergreen", "ongoing-habit", "deep-work", "skill-building"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Work / productivity routines
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "cal-newport-deep-work-blocks",
    title: "Cal Newport's deep work blocks",
    category: "productivity",
    summary:
      "90-minute distraction-free sessions on cognitively demanding work; phone elsewhere, Slack/email closed.",
    whatItIs:
      "90-minute distraction-free sessions on cognitively demanding work; phone elsewhere, Slack and email closed. Reinforced in Newport's Slow Productivity (2024 — Economist & NPR Best Book).",
    duration: "Ongoing daily, often run as 30-day or 12-week challenge",
    trackingChecklist: [
      "Block scheduled",
      "Phone away / focus mode",
      "Slack/email closed",
      "Outcome logged",
      "≥1 block today",
    ],
    whyItMatters:
      "Reinforced in Newport's Slow Productivity (2024 — Economist & NPR Best Book), and the foundational ritual for knowledge workers chasing meaningful output.",
    tags: ["deep-work", "productivity-system", "time-management", "productivity"],
  },
  {
    slug: "pomodoro-25-5",
    title: "Pomodoro (25/5)",
    category: "productivity",
    summary:
      "The most widely adopted focus method globally — 25 min work, 5 min break, 15–30 min long break after 4 cycles.",
    whatItIs:
      "The most widely adopted focus method globally — 25 minutes of work, 5 minute break, then a 15–30 minute long break after 4 cycles.",
    duration: "Ongoing",
    trackingChecklist: [
      "≥4 Pomodoros",
      "All breaks taken",
      "Interruptions logged",
      "Long break taken",
    ],
    whyItMatters:
      "The most widely adopted focus method globally and the gateway technique into structured time-management for students, devs, and writers.",
    tags: ["productivity-system", "time-management", "evergreen", "deep-work", "productivity"],
  },
  {
    slug: "flowmodoro-flowtime",
    title: "Flowmodoro / Flowtime",
    category: "productivity",
    summary:
      "Pomodoro alternative protecting flow state — work until natural fatigue, then 1 min break per 5 min worked.",
    whatItIs:
      "Pomodoro alternative protecting flow state — work until natural fatigue, then take a 1-minute break per 5 minutes worked. Growing among writers and developers.",
    duration: "Ongoing",
    trackingChecklist: [
      "Single task started",
      "Start/stop logged",
      "Proportional break",
      "≥1 hour total flow",
    ],
    whyItMatters:
      "Growing among writers and developers who find Pomodoro's fixed timer disrupts deep flow; better fits creative and engineering work.",
    tags: ["deep-work", "productivity-system", "time-management", "productivity"],
  },
  {
    slug: "90-20-ultradian-rhythm",
    title: "90/20 ultradian rhythm",
    category: "productivity",
    summary:
      "90-minute focus blocks aligned with Kleitman's BRAC, then real 15–20 min screen-free recovery.",
    whatItIs:
      "90-minute focus blocks aligned with Kleitman's BRAC (Basic Rest-Activity Cycle), followed by real 15–20 minute screen-free recovery. Endorsed by Anders Ericsson research.",
    duration: "Ongoing; often a 4-week experiment",
    trackingChecklist: [
      "Block #1 (peak hours)",
      "20 min screen-free recovery",
      "Block #2",
      "Max 4–5 cycles",
      "Peak window identified",
    ],
    whyItMatters:
      "Endorsed by Anders Ericsson's research on elite performers, who naturally cycle work and recovery in 90-minute waves.",
    tags: ["deep-work", "productivity-system", "time-management", "productivity"],
  },
  {
    slug: "time-blocking-newport-musk",
    title: "Time blocking (Newport / Musk-style)",
    category: "productivity",
    summary:
      "Every minute pre-assigned on calendar; Musk and Gates work in 5-min blocks. Time-Block Planner is a top-selling productivity planner.",
    whatItIs:
      "Every minute of the day pre-assigned on a calendar; Elon Musk and Bill Gates work in 5-minute blocks. Cal Newport's Time-Block Planner is a top-selling productivity planner.",
    duration: "Ongoing daily",
    trackingChecklist: [
      "Calendar fully blocked",
      "Followed plan ≥80%",
      "Adjusted midday",
      "EOD review",
    ],
    whyItMatters:
      "Newport's Time-Block Planner is a top-selling productivity planner, and the Musk/Gates 5-minute block style is widely cited in executive routines.",
    tags: ["time-management", "productivity-system", "deep-work", "productivity"],
  },
  {
    slug: "themed-days",
    title: "Themed days",
    category: "productivity",
    summary:
      "Each weekday has a theme (planning Mon, deep work Tue/Wed, meetings Thu, admin Fri). Popularized by Jack Dorsey.",
    whatItIs:
      "Each weekday has a theme — for example, planning Monday, deep work Tuesday/Wednesday, meetings Thursday, admin Friday. Popularized by Jack Dorsey across Twitter and Square.",
    duration: "Ongoing weekly",
    trackingChecklist: [
      "Theme defined",
      "Calendar matches",
      "Off-theme requests declined",
      "Theme honored ≥75%",
    ],
    whyItMatters:
      "Popularized by Jack Dorsey when he ran Twitter and Square simultaneously; it's a way to reduce context-switching across leadership weeks.",
    tags: ["time-management", "productivity-system", "productivity"],
  },
  {
    slug: "eat-the-frog",
    title: "Eat the Frog (Brian Tracy / MIT)",
    category: "productivity",
    summary:
      "Hardest task first thing in the morning before email/Slack. Built into Todoist as a template.",
    whatItIs:
      "Hardest task ('the frog') first thing in the morning, before email or Slack. Codified by Brian Tracy and Mark Twain's earlier quote; built into Todoist as a template.",
    duration: "Ongoing; classic 30-day challenge",
    trackingChecklist: [
      "Frog identified night before",
      "No email/Slack first",
      "Frog done before noon",
      "Win celebrated",
    ],
    whyItMatters:
      "Built into Todoist as a template and one of the most-recommended productivity heuristics — finishing the hardest thing first cascades momentum through the day.",
    tags: ["evergreen", "productivity-system", "time-management", "productivity"],
  },
  {
    slug: "ivy-lee-method-6-priorities",
    title: "Ivy Lee Method (6 priorities)",
    category: "productivity",
    summary:
      "Each evening, write tomorrow's 6 most important tasks in priority order; work them sequentially.",
    whatItIs:
      "Each evening, write tomorrow's 6 most important tasks in priority order; the next day, work them sequentially without skipping ahead. A 100+ year-old method allegedly worth $400K (today's dollars) to Bethlehem Steel.",
    duration: "Ongoing",
    trackingChecklist: [
      "6 tasks written night before",
      "Ranked by priority",
      "#1 done before #2",
      "Unfinished migrated",
    ],
    whyItMatters:
      "Allegedly worth $400K (today's dollars) to Bethlehem Steel; 100+ years old and still one of the simplest, most effective single-page productivity systems.",
    tags: ["evergreen", "productivity-system", "time-management", "productivity"],
  },
  {
    slug: "1-3-5-rule",
    title: "1-3-5 rule",
    category: "productivity",
    summary:
      "1 big + 3 medium + 5 small tasks per day. Default Notion/Todoist template; popular on TikTok productivity creators.",
    whatItIs:
      "Cap your daily list at 1 big task, 3 medium tasks, and 5 small tasks. Default Notion and Todoist template; popular on TikTok productivity creators.",
    duration: "Ongoing",
    trackingChecklist: [
      "1 big done",
      "3 medium done",
      "5 small done",
      "List capped",
    ],
    whyItMatters:
      "Default Notion/Todoist template; popular on TikTok productivity creators because it forces realistic daily scoping.",
    tags: ["productivity-system", "time-management", "tiktok-trending", "productivity"],
  },
  {
    slug: "warren-buffett-25-5-rule",
    title: "Warren Buffett 25/5 rule",
    category: "productivity",
    summary:
      "List 25 career goals, circle the top 5, avoid the other 20 at all costs.",
    whatItIs:
      "List 25 career goals, circle the top 5, and avoid the other 20 at all costs. A focusing exercise (likely apocryphally) attributed to Warren Buffett, used quarterly.",
    duration: "One-time exercise, quarterly review",
    trackingChecklist: [
      "25 goals written",
      "Top 5 circled",
      "Avoid list made",
      "Alignment reviewed",
    ],
    whyItMatters:
      "Trending on LinkedIn productivity accounts; revisited quarterly as a powerful prioritization and saying-no tool.",
    tags: ["productivity-system", "time-management", "productivity"],
  },
  {
    slug: "gtd-weekly-review",
    title: "GTD + weekly review",
    category: "productivity",
    summary:
      "David Allen's capture → clarify → organize → reflect → engage. The Friday/Sunday weekly review is the keystone habit.",
    whatItIs:
      "David Allen's Getting Things Done methodology: capture → clarify → organize → reflect → engage. The Friday or Sunday weekly review is the keystone habit. Foundational on r/gtd, integrated into Todoist, OmniFocus, and Things 3.",
    duration: "Ongoing; weekly review",
    trackingChecklist: [
      "Inboxes emptied",
      "Next actions clarified",
      "Calendar reviewed (next 2 wks)",
      "Someday/maybe reviewed",
      "Weekly review done",
    ],
    whyItMatters:
      "Foundational on r/gtd, integrated into Todoist, OmniFocus, and Things 3 — the most influential personal productivity methodology of the past two decades.",
    tags: ["evergreen", "productivity-system", "time-management", "deep-work", "productivity"],
  },
  {
    slug: "12-week-year",
    title: "12 Week Year (Brian Moran)",
    category: "productivity",
    summary:
      "Replace the 12-month year with rolling 12-week sprints; weekly plan + 15–20 min weekly review + daily 5-min check-in.",
    whatItIs:
      "Replace the 12-month year with rolling 12-week sprints; weekly plan + 15–20 min weekly review + daily 5-min check-in. Surging on YouTube/Notion in 2024–2026.",
    duration: "12 weeks per cycle",
    trackingChecklist: [
      "12-week goals (max 1–3)",
      "Weekly plan written",
      "Daily 5-min review",
      "WAM (accountability)",
      "Execution score ≥85%",
    ],
    whyItMatters:
      "Surging on YouTube and Notion in 2024–2026 — many use the 'first 12 weeks of 2026' instead of resolutions to compress goal cycles.",
    tags: ["productivity-system", "time-bound", "time-management", "productivity"],
  },
  {
    slug: "para-building-a-second-brain",
    title: "PARA + Building a Second Brain (Tiago Forte)",
    category: "productivity",
    summary:
      "Projects/Areas/Resources/Archives with daily capture and weekly inbox processing; increasingly paired with Claude/ChatGPT for retrieval.",
    whatItIs:
      "Tiago Forte's PARA system (Projects/Areas/Resources/Archives) with daily capture and weekly inbox processing. Increasingly paired with Claude or ChatGPT for retrieval; huge on r/notion and r/obsidianmd.",
    duration: "Ongoing",
    trackingChecklist: [
      "≥3 captures today",
      "Inbox processed (weekly)",
      "Notes filed",
      "1 progressive summary",
      "Used Second Brain for output",
    ],
    whyItMatters:
      "Huge on r/notion and r/obsidianmd; increasingly paired with Claude/ChatGPT for retrieval, making it the default knowledge-management framework of 2025–2026.",
    tags: ["productivity-system", "ai-tools", "ongoing-habit", "deep-work", "productivity"],
  },
  {
    slug: "bullet-journal-ryder-carroll",
    title: "Bullet Journal (Ryder Carroll)",
    category: "productivity",
    summary:
      "Hand-written rapid-logging — daily/monthly/future logs, monthly migration. Part of the 2025–2026 calm tech / analog revival.",
    whatItIs:
      "Ryder Carroll's hand-written rapid-logging system — daily, monthly, and future logs, with monthly migration. Part of the 2025–2026 'calm tech' / analog revival alongside dumb phones.",
    duration: "Ongoing daily; monthly migration",
    trackingChecklist: [
      "Daily log entry",
      "Tasks marked/migrated/dropped",
      "Evening reflection",
      "Monthly migration",
    ],
    whyItMatters:
      "Part of the 2025–2026 'calm tech' / analog revival alongside dumb phones; remains a flagship analog productivity practice.",
    tags: ["journaling", "productivity-system", "ongoing-habit", "evergreen", "productivity"],
  },
  {
    slug: "inbox-zero-email-batching",
    title: "Inbox Zero + email batching",
    category: "productivity",
    summary:
      "Process to zero with 1–3 fixed checks per day. Resurging as part of monk-mode and slow-productivity backlash to Slack culture.",
    whatItIs:
      "Process email to zero, with 1–3 fixed checks per day. Resurging as part of monk-mode and slow-productivity backlash to Slack culture.",
    duration: "Ongoing",
    trackingChecklist: [
      "Email only at scheduled times",
      "Notifications off",
      "Inbox zero by EOD",
      "2-min rule applied",
    ],
    whyItMatters:
      "Resurging in 2025–2026 as part of monk-mode and slow-productivity culture, pushing back against always-on Slack and email.",
    tags: ["productivity-system", "deep-work", "monk-mode", "productivity"],
  },
  {
    slug: "no-meeting-days",
    title: "No-meeting days / No Meeting Wednesdays",
    category: "productivity",
    summary:
      "Shopify's 2023 calendar purge deleted 322,000 hours of meetings; copied by Asana, GitLab, Meta, Canva, Clorox.",
    whatItIs:
      "Designate one or more weekdays (often Wednesday) as meeting-free, freeing the calendar for deep work. Shopify's 2023 calendar purge deleted 322,000 hours of meetings; copied across the industry.",
    duration: "Ongoing weekly",
    trackingChecklist: [
      "Wednesday calendar clear",
      "Meeting invites declined",
      "≥4 hrs deep work",
      "Async update sent",
    ],
    whyItMatters:
      "Shopify's 2023 calendar purge deleted 322,000 hours of meetings; copied by Asana, GitLab, Meta, Canva, and Clorox as a deep-work multiplier.",
    tags: ["deep-work", "productivity-system", "time-management", "productivity"],
  },
  {
    slug: "founder-ceo-morning-stack",
    title: "Founder/CEO morning stack",
    category: "productivity",
    summary:
      "Tim Cook's 4–4:30am, Bezos's 'high-IQ window' 10am–12pm, Musk's 5-min blocks, plus Sahil Bloom's 5-5-5-30.",
    whatItIs:
      "A composite of executive morning routines: Tim Cook's 4–4:30am wake, Bezos's 'high-IQ window' 10am–12pm, Musk's 5-minute blocks, plus Sahil Bloom's 2025 '5-5-5-30' condensed version (5 min meditate, 5 min read, 5 min visualize, 30 min move).",
    duration: "Ongoing; often a 30/75-day challenge",
    trackingChecklist: [
      "Wake before 6am",
      "No phone first hour",
      "30+ min movement",
      "5–10 min meditation/journal",
      "Hard-thinking task before noon",
    ],
    whyItMatters:
      "Aggregates the practices that recurring CEO and founder profiles point to as their highest-leverage daily ritual; a template for ambitious ICs to copy.",
    tags: ["productivity-system", "deep-work", "time-management", "ongoing-habit", "productivity"],
  },
  {
    slug: "5-minute-journal-daily-stoic",
    title: "5-Minute Journal / Daily Stoic",
    category: "productivity",
    summary:
      "5 min AM (gratitude, intention, what would make today great) + 5 min PM (highlights, lessons). Tim Ferriss's boot-up sequence.",
    whatItIs:
      "5 minutes in the morning (3 gratitudes, daily intention, what would make today great) plus 5 minutes at night (highlights, lessons). Tim Ferriss calls it his 'boot-up sequence.'",
    duration: "Ongoing; classic 30-day starter",
    trackingChecklist: [
      "3 gratitudes",
      "Daily intention",
      "Affirmation",
      "3 highlights",
      "1 lesson / reactivity score",
    ],
    whyItMatters:
      "Tim Ferriss calls it his 'boot-up sequence,' and the format has spawned a multi-million-copy journal franchise that bookends countless productive days.",
    tags: ["journaling", "mindfulness", "evergreen", "productivity-system", "productivity"],
  },
  {
    slug: "monk-mode-30-60-90-day",
    title: "Monk Mode (30/60/90-day)",
    category: "productivity",
    summary:
      "Time-bound extreme focus — cut social media, alcohol, late nights, most socializing.",
    whatItIs:
      "Time-bound extreme focus — cut social media, alcohol, late nights, and most socializing for 30, 60, or 90 days. Searches surged 2024–2026 alongside the dumb-phone trend.",
    duration: "30, 60, or 90 days",
    trackingChecklist: [
      "No social media",
      "No alcohol",
      "In bed by 10pm",
      "≥4 hrs deep work",
      "Workout",
      "Streak day",
    ],
    whyItMatters:
      "Searches surged 2024–2026 alongside the dumb-phone trend; the go-to short-term reset for ambitious knowledge workers wanting a step change.",
    tags: ["monk-mode", "hardcore", "time-bound", "deep-work", "social-media-detox", "productivity"],
  },
  {
    slug: "ai-first-daily-planning",
    title: "AI-first daily planning (Claude / ChatGPT / Notion AI)",
    category: "productivity",
    summary:
      "The defining new productivity routine of 2025–2026. Morning AI briefing, AI-co-planned priorities, AI-drafted email/docs, weekly automation builds.",
    whatItIs:
      "The defining new productivity routine of 2025–2026. Morning AI briefing, AI-co-planned priorities, AI-drafted email and docs, and weekly automation builds. Claude Cowork (Oct 2025) and ChatGPT Agent (mid-2025) launched specifically to support this; replacing classic to-do apps for many knowledge workers.",
    duration: "Ongoing daily; weekly automations",
    trackingChecklist: [
      "AI morning briefing",
      "Top 3 priorities co-planned",
      "AI drafted email/doc",
      "Prompt captured for reuse",
      "1 automation built/improved this week",
    ],
    whyItMatters:
      "Claude Cowork (Oct 2025) and ChatGPT Agent (mid-2025) launched specifically to support this routine; it is rapidly replacing classic to-do apps for many knowledge workers.",
    tags: ["ai-tools", "productivity-system", "deep-work", "ongoing-habit", "productivity"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Personal development / wellbeing
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "miracle-morning-savers",
    title: "Miracle Morning (SAVERS)",
    category: "personal-development",
    summary:
      "Hal Elrod's six-step routine: Silence, Affirmations, Visualization, Exercise, Reading, Scribing. 3M+ copies sold.",
    whatItIs:
      "Hal Elrod's six-step morning routine: Silence (meditation), Affirmations, Visualization, Exercise, Reading, and Scribing (journaling). 3M+ copies sold in 40+ languages, with an official SAVERS app.",
    duration: "Ongoing; 30-day onboarding",
    trackingChecklist: [
      "Silence/meditation",
      "Affirmations",
      "Visualization",
      "Exercise",
      "Read 10+ pages",
      "Scribe/journal",
      "Wake-up time",
    ],
    whyItMatters:
      "3M+ copies sold in 40+ languages; an official SAVERS app exists. The most franchised morning-routine framework of the past decade.",
    tags: ["evergreen", "journaling", "meditation", "ongoing-habit", "personal-development"],
  },
  {
    slug: "5-am-club-20-20-20",
    title: "5 AM Club (20/20/20)",
    category: "personal-development",
    summary:
      "Robin Sharma: wake at 5 AM and use the Victory Hour as 20 min sweat / 20 min reflection / 20 min growth.",
    whatItIs:
      "Robin Sharma's framework: wake at 5 AM and use the 'Victory Hour' as 20 minutes sweat, 20 minutes reflection, and 20 minutes growth/learning. Underpins Gymshark66 and many executive routines.",
    duration: "Ongoing; 66-day install",
    trackingChecklist: [
      "Wake by 5:00",
      "20 min movement",
      "20 min reflection",
      "20 min learning",
      "Phone-free first hour",
    ],
    whyItMatters:
      "Underpins Gymshark66 and many executive routines as a structured way to capture the highest-leverage hour of the day.",
    tags: ["evergreen", "ongoing-habit", "deep-work", "fitness", "personal-development"],
  },
  {
    slug: "huberman-morning-protocol",
    title: "Andrew Huberman morning protocol",
    category: "personal-development",
    summary:
      "Science-backed neuroscience stack: morning sunlight, hydration with electrolytes, delayed caffeine, movement, cold exposure, NSDR.",
    whatItIs:
      "Andrew Huberman's science-backed neuroscience stack: morning sunlight, hydration with electrolytes, delayed caffeine, movement, cold exposure, and NSDR. One of the most-referenced protocols on TikTok and X in 2025–2026.",
    duration: "Ongoing",
    trackingChecklist: [
      "10 min sunlight (within 30–60 min of waking)",
      "16–32 oz water + electrolytes",
      "Delay caffeine 90–120 min",
      "Cold 1–3 min",
      "Movement within 3 hrs",
      "NSDR 10–30 min",
      "Caffeine cut by noon",
      "Evening sunlight",
    ],
    whyItMatters:
      "One of the most-referenced protocols on TikTok and X in 2025–2026; the closest thing to a standard 'optimization' morning stack.",
    tags: ["longevity", "tiktok-trending", "cold-exposure", "ongoing-habit", "personal-development"],
  },
  {
    slug: "winter-arc-great-lock-in",
    title: "Winter Arc / Great Lock-In",
    category: "personal-development",
    summary:
      "TikTok-born 90-day self-improvement season — typically Oct 1–Jan 1. #winterarc has 500K+ TikTok posts.",
    whatItIs:
      "TikTok-born 90-day self-improvement season — typically October 1 to January 1, but year-round in 2025–2026. The 2025 Gen Z rebrand is 'the Great Lock In.'",
    duration: "90 days",
    trackingChecklist: [
      "Workout",
      "Protein every meal",
      "100 oz water",
      "10K steps",
      "Consistent wake",
      "Skincare AM/PM",
      "Screen-time limit",
      "Read/learn",
      "Daily plan written",
    ],
    whyItMatters:
      "#winterarc has 500K+ TikTok posts; the 2025 Gen Z rebrand 'the Great Lock In' has made it a year-round self-improvement season.",
    tags: ["tiktok-trending", "time-bound", "fitness", "monk-mode", "personal-development"],
  },
  {
    slug: "atomic-habits-stacking-1-percent-better",
    title: "Atomic Habits — habit stacking & 1% better",
    category: "personal-development",
    summary:
      "James Clear's identity-based stacking ('After I X, I will Y') with 1% daily improvement. 20M+ copies sold.",
    whatItIs:
      "James Clear's identity-based habit stacking ('After I X, I will Y') with 1% daily improvement. The dominant habit-formation framework, referenced in nearly every habit-tracker app.",
    duration: "Ongoing",
    trackingChecklist: [
      "Stacked habit done",
      "2-min version (when busy)",
      "Environment cue set",
      "Identity statement reviewed",
      "Streak length",
    ],
    whyItMatters:
      "20M+ copies sold; the dominant habit-formation framework, referenced in nearly every habit-tracker app on the market.",
    tags: ["evergreen", "ongoing-habit", "productivity-system", "personal-development"],
  },
  {
    slug: "dont-break-the-chain-seinfeld",
    title: "Don't Break the Chain (Seinfeld method)",
    category: "personal-development",
    summary:
      "Mark a big X every day you complete the habit; never break the chain. Baseline mechanic of Streaks, Way of Life, and most habit apps.",
    whatItIs:
      "Mark a big X on the calendar every day you complete the habit; never break the chain. Attributed to Jerry Seinfeld; the baseline mechanic of Streaks, Way of Life, and most habit apps.",
    duration: "Ongoing",
    trackingChecklist: [
      "Habit done",
      "Current streak",
      "Longest streak",
      "Calendar X marked",
    ],
    whyItMatters:
      "The baseline streak mechanic copied by Streaks, Way of Life, and most habit apps — arguably the most influential single productivity heuristic of the past 20 years.",
    tags: ["evergreen", "ongoing-habit", "productivity-system", "personal-development"],
  },
  {
    slug: "tiny-habits-bj-fogg",
    title: "Tiny Habits — BJ Fogg",
    category: "personal-development",
    summary:
      "Anchor a tiny version of a behavior to an existing routine, then immediately celebrate. Foundational alongside Atomic Habits.",
    whatItIs:
      "Anchor a tiny version of a behavior to an existing routine, then immediately celebrate. BJ Fogg's behavior-design model, foundational alongside Atomic Habits.",
    duration: "Ongoing; 5–7 days to install",
    trackingChecklist: [
      "Anchor moment identified",
      "Tiny behavior done",
      "Celebration",
      "Recipe written",
    ],
    whyItMatters:
      "Foundational text alongside Atomic Habits; BJ Fogg's Stanford behavior-design lab work underpins much of modern habit research.",
    tags: ["evergreen", "ongoing-habit", "beginner-friendly", "personal-development"],
  },
  {
    slug: "goodreads-reading-challenge",
    title: "Goodreads reading challenge / daily pages",
    category: "personal-development",
    summary:
      "Annual public goal (12, 24, 52 books) + daily pages. 6M+ join Goodreads Challenge annually.",
    whatItIs:
      "An annual public reading goal (12, 24, 52 books) combined with daily pages. Companions: 5 pages before phone (Tim Ferriss), audiobooks on commute, 30 pages daily.",
    duration: "Annual + ongoing daily",
    trackingChecklist: [
      "Read ≥10 (or 30) pages",
      "5 pages before phone",
      "Audiobook on commute",
      "Books finished YTD",
      "On pace?",
    ],
    whyItMatters:
      "6M+ join the Goodreads Challenge annually — the largest public reading commitment platform on the internet.",
    tags: ["evergreen", "ongoing-habit", "skill-building", "personal-development"],
  },
  {
    slug: "daily-meditation",
    title: "Daily meditation (Headspace / Calm / Waking Up / 10% Happier)",
    category: "personal-development",
    summary:
      "10–20 min mindfulness via app or unguided. Headspace + Calm have 100M+ combined downloads.",
    whatItIs:
      "10–20 minutes of daily mindfulness via app (Headspace, Calm, Waking Up, 10% Happier) or unguided. Adjacent practices: TM, Vipassana, box breathing, physiological sighs.",
    duration: "Ongoing; 30-day starter courses",
    trackingChecklist: [
      "10/20 min sit",
      "App session",
      "Breathwork",
      "Body scan",
      "Mindful walk",
    ],
    whyItMatters:
      "Headspace + Calm have 100M+ combined downloads; Sam Harris's Waking Up is the fastest-growing premium app among educated millennials.",
    tags: ["meditation", "mindfulness", "evergreen", "ongoing-habit", "personal-development"],
  },
  {
    slug: "gratitude-stoic-journaling",
    title: "Gratitude / Stoic journaling",
    category: "personal-development",
    summary:
      "Five Minute Journal AM/PM + Daily Stoic prompts + (optional) Morning Pages. 1M+ Five Minute Journal users.",
    whatItIs:
      "Combine Five Minute Journal AM/PM with Daily Stoic prompts and optional Morning Pages. A bookended gratitude and reflection practice.",
    duration: "Ongoing",
    trackingChecklist: [
      "3 gratitudes",
      "Daily intention",
      "Morning Pages",
      "Stoic prompt read",
      "Evening reflection",
      "Memento mori",
    ],
    whyItMatters:
      "Five Minute Journal has 1M+ users; Daily Stoic email has 750K+ subscribers — making this the most adopted gratitude/reflection stack online.",
    tags: ["journaling", "mindfulness", "ongoing-habit", "evergreen", "personal-development"],
  },
  {
    slug: "cold-exposure",
    title: "Cold exposure (Wim Hof / cold plunge / contrast)",
    category: "personal-development",
    summary:
      "Daily cold shower (30 sec → 2–3 min) or plunge (1–3 min at 38–55°F). Huberman: 11 min/week of cold for ~250% dopamine spike.",
    whatItIs:
      "Daily cold shower (30 sec → 2–3 min) or plunge (1–3 min at 38–55°F); Huberman recommends 11 min/week of cold for a ~250% dopamine spike. The cold-plunge market exploded 2024–2025.",
    duration: "Ongoing",
    trackingChecklist: [
      "Cold shower",
      "Cold plunge",
      "Sauna session",
      "WHM breathing rounds",
      "Total weekly cold minutes",
    ],
    whyItMatters:
      "The cold-plunge market exploded 2024–2025; Huberman's 11-min/week recommendation has made cold exposure a mainstream wellness habit.",
    tags: ["cold-exposure", "longevity", "mental-toughness", "ongoing-habit", "personal-development"],
  },
  {
    slug: "digital-detox-dopamine-fasting",
    title: "Digital detox / dopamine fasting / phone-free mornings",
    category: "personal-development",
    summary:
      "Cameron Sepah's Dopamine Fast, Newport's Digital Minimalism 30-day declutter, grayscale phone, Catherine Price's Phone Breakup.",
    whatItIs:
      "A family of digital-minimalism practices: Cameron Sepah's Dopamine Fast (1 day/week, 1 weekend/quarter), Cal Newport's Digital Minimalism 30-day declutter, grayscale phone, and Catherine Price's 'Phone Breakup.'",
    duration: "30-day challenges or ongoing",
    trackingChecklist: [
      "No phone first 60 min",
      "No social media",
      "Screen-time goal hit",
      "Grayscale on",
      "No screens after 9pm",
      "Phone outside bedroom",
    ],
    whyItMatters:
      "r/digitalminimalism has 600K+ members and the movement keeps growing as a backlash to attention-economy apps.",
    tags: ["social-media-detox", "monk-mode", "mindfulness", "time-bound", "personal-development"],
  },
  {
    slug: "daily-stoicism-memento-mori",
    title: "Daily Stoicism / memento mori / voluntary discomfort",
    category: "personal-development",
    summary:
      "Daily Stoic passage + premeditatio malorum + weekly voluntary discomfort + memento mori reminder. r/Stoicism has 650K+ members.",
    whatItIs:
      "A Stoic practice stack: daily Stoic passage, premeditatio malorum (negative visualization), weekly voluntary discomfort, and memento mori reminders. Often started with the 365-Day Daily Stoic onboarding.",
    duration: "Ongoing; 365-Day Daily Stoic onboarding",
    trackingChecklist: [
      "Stoic passage read",
      "Morning preparation",
      "Evening review",
      "Voluntary discomfort (weekly)",
      "Memento mori reminder",
    ],
    whyItMatters:
      "r/Stoicism has 650K+ members; Stoicism is one of the most actively practiced philosophical traditions in the modern self-improvement space.",
    tags: ["mindfulness", "evergreen", "journaling", "ongoing-habit", "personal-development"],
  },
  {
    slug: "therapy-mental-health-tracking",
    title: "Therapy & mental-health tracking",
    category: "personal-development",
    summary:
      "Weekly therapy + daily mood/anxiety check-ins, CBT thought records (Daylio, How We Feel, Bearable, Finch).",
    whatItIs:
      "Weekly therapy combined with daily mood and anxiety check-ins, plus CBT thought records (via Daylio, How We Feel, Bearable, or Finch). Over half of Gen Z reports using a mood tracker.",
    duration: "Ongoing",
    trackingChecklist: [
      "Mood logged (1–10)",
      "Anxiety check-in",
      "CBT thought record",
      "Therapy attended",
      "Medication taken",
      "One emotion named",
    ],
    whyItMatters:
      "Over half of Gen Z reports using a mood tracker; therapy attendance among under-35s is at an all-time high in 2025–2026.",
    tags: ["mindfulness", "journaling", "ongoing-habit", "personal-development"],
  },
  {
    slug: "no-spend-saving-plans",
    title: "No-spend challenges & saving plans",
    category: "personal-development",
    summary:
      "No-Spend Month, 52-Week Saving Challenge, $X/day savings rule, Dave Ramsey Baby Steps, FIRE expense logging.",
    whatItIs:
      "A bundle of money habits: No-Spend Month, the 52-Week Saving Challenge ($1 → $52 = $1,378), $X/day savings rules, Dave Ramsey's Baby Steps, and FIRE expense logging via YNAB, Monarch, or Copilot.",
    duration: "30 days / 52 weeks / ongoing",
    trackingChecklist: [
      "No discretionary spending",
      "Every expense logged",
      "Auto-saved $X",
      "Weekly 52-week deposit",
      "Net-worth update",
      "Under category budget",
    ],
    whyItMatters:
      "r/personalfinance has 20M+ members; r/financialindependence 2M+. Money discipline routines have huge active communities.",
    tags: ["finance", "time-bound", "ongoing-habit", "personal-development"],
  },
  {
    slug: "sleep-hygiene-walker-10-3-2-1-0",
    title: "Sleep hygiene (Walker / 10-3-2-1-0 rule)",
    category: "personal-development",
    summary:
      "8 hours, consistent times, no screens 1 hr before bed, room <68°F. The 10-3-2-1-0 rule structures the wind-down.",
    whatItIs:
      "Sleep hygiene basics from Matthew Walker: 8 hours, consistent times, no screens 1 hour before bed, room below 68°F. The 10-3-2-1-0 rule: 10 hrs no caffeine, 3 hrs no food/alcohol, 2 hrs no work, 1 hr no screens, 0 snoozes. Oura/Whoop/Garmin tracking is mainstream.",
    duration: "Ongoing",
    trackingChecklist: [
      "7–9 hrs sleep",
      "Same wake time (±30 min)",
      "No caffeine after 2pm",
      "No food 3 hrs before bed",
      "No screens 1 hr before bed",
      "Bedroom <68°F",
      "Sleep score",
      "Zero snoozes",
    ],
    whyItMatters:
      "Oura/Whoop/Garmin tracking is mainstream, and Walker's Why We Sleep made sleep hygiene a default optimization category for high-performers.",
    tags: ["sleep", "longevity", "evergreen", "ongoing-habit", "personal-development"],
  },
  {
    slug: "sober-curious-mindful-drinking",
    title: "Sober-curious / Dry January / mindful drinking",
    category: "personal-development",
    summary:
      "49% of Americans plan to drink less in 2025; 22–30% of US adults did Dry January 2025; 65% of Gen Z planning to cut back.",
    whatItIs:
      "A spectrum of mindful-drinking practices: Dry January, ongoing sober-curious living, mocktails, NA beer, 'zebra-striping,' and Damp January.",
    duration: "30-day challenges; ongoing for many",
    trackingChecklist: [
      "Alcohol-free today",
      "Drinks this week",
      "Mocktail/NA alternative",
      "Mood/sleep/energy log",
      "Money saved",
      "Streak",
    ],
    whyItMatters:
      "49% of Americans plan to drink less in 2025 (NCSolutions); 22–30% of US adults did Dry January 2025; 65% of Gen Z planning to cut back.",
    tags: ["sober-curious", "tiktok-trending", "ongoing-habit", "personal-development"],
  },
  {
    slug: "soft-girl-era-everything-shower-morning-shed",
    title: "Soft Girl Era / Everything Shower / Morning Shed",
    category: "personal-development",
    summary:
      "TikTok 2025–2026 self-care bundle: Soft Girl Reset, the weekly Everything Shower, and the nightly Morning Shed (#morningshed: 100M+ views).",
    whatItIs:
      "TikTok 2025–2026 self-care bundle: Soft Girl Reset (slow mornings, gentle movement, boundaries), the Everything Shower (weekly 30–60 min multi-step ritual), and the Morning Shed (overnight mouth tape, chin strap, silk bonnet, heatless curls).",
    duration: "Ongoing; Everything Shower weekly; Morning Shed nightly",
    trackingChecklist: [
      "Slow morning (no rush, no phone)",
      "Skincare AM",
      "Skincare PM + overnight stack",
      "Everything Shower (weekly)",
      "Boundary set / 'no' said",
      "One moment romanticized",
      "Phone-free hour",
      "Bath / face mask / gua sha",
    ],
    whyItMatters:
      "#morningshed has 100M+ TikTok views; this self-care bundle has become a defining wellness trend among Gen Z women in 2025–2026.",
    caveat:
      "Cleveland Clinic and dermatologists in 2025–2026 coverage flag castor-oil packs and chin straps as cosmetic-only or potentially risky.",
    tags: ["tiktok-trending", "mindfulness", "gentle", "ongoing-habit", "personal-development"],
  },
  {
    slug: "relationship-connection-habits",
    title: "Relationship & connection habits",
    category: "personal-development",
    summary:
      "Call a friend daily, weekly date night, family dinner, gratitude text, '5 love languages' awareness.",
    whatItIs:
      "Daily and weekly connection habits: call a friend daily, weekly date night, family dinner, gratitude text, and '5 love languages' awareness. The most-cited longevity factor across Blue Zones research and Harvard's 80+ year Adult Development Study.",
    duration: "Ongoing",
    trackingChecklist: [
      "Called/texted a friend",
      "Date night (weekly)",
      "Family dinner",
      "Gratitude text sent",
      "Quality time logged",
    ],
    whyItMatters:
      "The most-cited longevity factor across Blue Zones research and Harvard's 80+ year Adult Development Study — relationship quality predicts health and happiness more than almost anything else.",
    tags: ["relationships", "longevity", "ongoing-habit", "evergreen", "personal-development"],
  },
  {
    slug: "dumb-phone-calm-tech-challenge",
    title: "Dumb-phone / calm-tech challenge",
    category: "personal-development",
    summary:
      "Switch to Light Phone III, Punkt MP02, or Nokia for 30+ days. 300%+ search growth 2024–2025.",
    whatItIs:
      "Switch primary phone to a Light Phone III, Punkt MP02, or Nokia dumb phone for 30+ days. A Gen Z–led rebellion against the attention economy.",
    duration: "30-day challenge or ongoing",
    trackingChecklist: [
      "Smartphone-free hours today",
      "Dumb phone primary",
      "Apps deleted",
      "Notifications off",
      "Streak",
    ],
    whyItMatters:
      "300%+ search growth 2024–2025; a Gen Z–led rebellion against the attention economy and a high-conviction step in the digital-minimalism movement.",
    tags: ["social-media-detox", "monk-mode", "mindfulness", "tiktok-trending", "personal-development"],
  },
];

// Module-load-time guard: surfaces duplicate slugs immediately when the
// seed is imported (during dev / build / convex push) instead of waiting
// for `by_slug` index conflicts at runtime.
(() => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const r of POPULAR_ROUTINES_SEED) {
    if (seen.has(r.slug)) duplicates.push(r.slug);
    else seen.add(r.slug);
  }
  if (duplicates.length > 0) {
    throw new Error(
      `POPULAR_ROUTINES_SEED contains duplicate slugs: ${duplicates.join(", ")}`,
    );
  }
})();
