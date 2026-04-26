import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  POPULAR_ROUTINES_SEED,
  type PopularRoutineSeed,
  type RoutineCategory,
} from "./lib/popularRoutinesSeed";

const categoryValidator = v.union(
  v.literal("fitness"),
  v.literal("skill-building"),
  v.literal("productivity"),
  v.literal("personal-development"),
);

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const stored = await ctx.db.query("popularRoutines").collect();
    if (stored.length === 0) {
      return POPULAR_ROUTINES_SEED.map(toClientShape);
    }
    return stored.map(toClientShapeFromDoc);
  },
});

export const listByCategory = query({
  args: { category: categoryValidator },
  handler: async (ctx, args) => {
    const stored = await ctx.db
      .query("popularRoutines")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
    if (stored.length === 0) {
      return POPULAR_ROUTINES_SEED.filter((r) => r.category === args.category).map(
        toClientShape,
      );
    }
    return stored.map(toClientShapeFromDoc);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const stored = await ctx.db
      .query("popularRoutines")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (stored) return toClientShapeFromDoc(stored);
    const seedMatch = POPULAR_ROUTINES_SEED.find((r) => r.slug === args.slug);
    return seedMatch ? toClientShape(seedMatch) : null;
  },
});

/**
 * Build the canonical text that goes into the embedding. Kept stable so we
 * only re-embed when source content actually changes.
 */
export function buildEmbeddingText(seed: PopularRoutineSeed): string {
  const parts = [
    `Title: ${seed.title}`,
    `Category: ${humanCategory(seed.category)}`,
    `Tags: ${seed.tags.join(", ")}`,
    `Summary: ${seed.summary}`,
    `What it is: ${seed.whatItIs}`,
    `Duration: ${seed.duration}`,
    seed.trackingChecklist.length > 0
      ? `Daily/weekly tracking: ${seed.trackingChecklist.join("; ")}`
      : null,
    `Why it matters: ${seed.whyItMatters}`,
    seed.caveat ? `Caveat: ${seed.caveat}` : null,
  ].filter((x): x is string => x !== null);
  return parts.join("\n");
}

function humanCategory(c: RoutineCategory): string {
  switch (c) {
    case "fitness":
      return "Fitness & physical health";
    case "skill-building":
      return "Skill-building / mastery";
    case "productivity":
      return "Work / productivity";
    case "personal-development":
      return "Personal development / wellbeing";
  }
}

function toClientShape(seed: PopularRoutineSeed) {
  return {
    slug: seed.slug,
    title: seed.title,
    category: seed.category,
    summary: seed.summary,
    whatItIs: seed.whatItIs,
    duration: seed.duration,
    trackingChecklist: seed.trackingChecklist,
    whyItMatters: seed.whyItMatters,
    caveat: seed.caveat,
    tags: seed.tags,
    sourceUrl: seed.sourceUrl,
  };
}

function toClientShapeFromDoc<
  T extends {
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
  },
>(doc: T) {
  return {
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    summary: doc.summary,
    whatItIs: doc.whatItIs,
    duration: doc.duration,
    trackingChecklist: doc.trackingChecklist,
    whyItMatters: doc.whyItMatters,
    caveat: doc.caveat,
    tags: doc.tags,
    sourceUrl: doc.sourceUrl,
  };
}

// ---------------------------------------------------------------------------
// Seeding & embeddings
// ---------------------------------------------------------------------------

type UpsertResult = {
  inserted: number;
  updated: number;
  unchanged: number;
  embeddingsRefreshed: number;
};

/**
 * Idempotent seed of POPULAR_ROUTINES_SEED into the table. Diffs by
 * `embeddingText` to know whether to clear the existing embedding (forcing a
 * re-embed on the next `embedMissing` run).
 */
export const _upsertSeeds = internalMutation({
  args: {},
  handler: async (ctx): Promise<UpsertResult> => {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let embeddingsRefreshed = 0;

    for (const seed of POPULAR_ROUTINES_SEED) {
      const embeddingText = buildEmbeddingText(seed);
      const existing = await ctx.db
        .query("popularRoutines")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();

      if (!existing) {
        await ctx.db.insert("popularRoutines", {
          slug: seed.slug,
          title: seed.title,
          category: seed.category,
          summary: seed.summary,
          whatItIs: seed.whatItIs,
          duration: seed.duration,
          trackingChecklist: seed.trackingChecklist,
          whyItMatters: seed.whyItMatters,
          caveat: seed.caveat,
          tags: seed.tags,
          sourceUrl: seed.sourceUrl,
          embeddingText,
          embedding: undefined,
        });
        inserted += 1;
        continue;
      }

      const textChanged = existing.embeddingText !== embeddingText;
      const fieldChanged =
        existing.title !== seed.title ||
        existing.category !== seed.category ||
        existing.summary !== seed.summary ||
        existing.whatItIs !== seed.whatItIs ||
        existing.duration !== seed.duration ||
        existing.whyItMatters !== seed.whyItMatters ||
        existing.caveat !== seed.caveat ||
        existing.sourceUrl !== seed.sourceUrl ||
        existing.trackingChecklist.join("\n") !==
          seed.trackingChecklist.join("\n") ||
        existing.tags.join("\n") !== seed.tags.join("\n");

      if (textChanged) {
        await ctx.db.patch(existing._id, {
          title: seed.title,
          category: seed.category,
          summary: seed.summary,
          whatItIs: seed.whatItIs,
          duration: seed.duration,
          trackingChecklist: seed.trackingChecklist,
          whyItMatters: seed.whyItMatters,
          caveat: seed.caveat,
          tags: seed.tags,
          sourceUrl: seed.sourceUrl,
          embeddingText,
          embedding: undefined,
        });
        updated += 1;
        embeddingsRefreshed += 1;
      } else if (fieldChanged) {
        await ctx.db.patch(existing._id, {
          title: seed.title,
          category: seed.category,
          summary: seed.summary,
          whatItIs: seed.whatItIs,
          duration: seed.duration,
          trackingChecklist: seed.trackingChecklist,
          whyItMatters: seed.whyItMatters,
          caveat: seed.caveat,
          tags: seed.tags,
          sourceUrl: seed.sourceUrl,
        });
        updated += 1;
      } else {
        unchanged += 1;
      }
    }

    return { inserted, updated, unchanged, embeddingsRefreshed };
  },
});

export const _listMissingEmbeddings = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    // Filter at the DB layer so we only materialise rows that still need
    // embedding work, then take(limit) to bound the read.
    const missing = await ctx.db
      .query("popularRoutines")
      .filter((q) => q.eq(q.field("embedding"), undefined))
      .take(args.limit);
    return missing.map((r) => ({
      _id: r._id,
      slug: r.slug,
      embeddingText: r.embeddingText ?? "",
    }));
  },
});

export const _setEmbedding = internalMutation({
  args: { id: v.id("popularRoutines"), embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { embedding: args.embedding });
  },
});

export const _setEmbeddings = internalMutation({
  args: {
    items: v.array(
      v.object({
        id: v.id("popularRoutines"),
        embedding: v.array(v.float64()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.items.map((item) =>
        ctx.db.patch(item.id, { embedding: item.embedding }),
      ),
    );
    return { written: args.items.length };
  },
});

export const _clearAllEmbeddings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("popularRoutines").collect();
    const CHUNK = 32;
    for (let i = 0; i < all.length; i += CHUNK) {
      const chunk = all.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map((row) => ctx.db.patch(row._id, { embedding: undefined })),
      );
    }
    return { cleared: all.length };
  },
});

/**
 * Idempotent: seed rows, then embed any without an embedding using
 * OpenAI text-embedding-3-small. Safe to re-run.
 */
export const seedAndEmbed = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (
    ctx,
    args,
  ): Promise<{ upsert: UpsertResult; embedded: number }> => {
    const upsert: UpsertResult = await ctx.runMutation(
      internal.popularRoutines._upsertSeeds,
      {},
    );

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[popularRoutines] OPENAI_API_KEY not set — skipping embedding step. " +
          "Set it via `npx convex env set OPENAI_API_KEY sk-...` to enable RAG.",
      );
      return { upsert, embedded: 0 };
    }

    const batchSize = args.batchSize ?? 32;
    let totalEmbedded = 0;

    while (true) {
      const batch: Array<{
        _id: Id<"popularRoutines">;
        slug: string;
        embeddingText: string;
      }> = await ctx.runQuery(
        internal.popularRoutines._listMissingEmbeddings,
        { limit: batchSize },
      );
      if (batch.length === 0) break;

      const inputs = batch.map((b) => b.embeddingText);
      const embeddings = await embedBatch(apiKey, inputs);

      await ctx.runMutation(internal.popularRoutines._setEmbeddings, {
        items: batch.map((b, i) => ({
          id: b._id,
          embedding: embeddings[i],
        })),
      });
      totalEmbedded += batch.length;
    }

    return { upsert, embedded: totalEmbedded };
  },
});

const EMBED_FETCH_TIMEOUT_MS = 20_000;

async function embedBatch(
  apiKey: string,
  inputs: string[],
): Promise<number[][]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBED_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: inputs,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        `OpenAI embeddings timed out after ${EMBED_FETCH_TIMEOUT_MS}ms`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };
  // OpenAI returns data in input order, but sort defensively just in case.
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

async function embedQuery(apiKey: string, query: string): Promise<number[]> {
  const [vec] = await embedBatch(apiKey, [query]);
  return vec;
}

// ---------------------------------------------------------------------------
// Vector search
// ---------------------------------------------------------------------------

export type RoutineSearchHit = {
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
  score: number;
};

export const _hydrateHits = internalQuery({
  args: {
    ids: v.array(v.id("popularRoutines")),
    scores: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<RoutineSearchHit[]> => {
    const out: RoutineSearchHit[] = [];
    for (let i = 0; i < args.ids.length; i++) {
      const doc = await ctx.db.get(args.ids[i]);
      if (!doc) continue;
      out.push({
        slug: doc.slug,
        title: doc.title,
        category: doc.category,
        summary: doc.summary,
        whatItIs: doc.whatItIs,
        duration: doc.duration,
        trackingChecklist: doc.trackingChecklist,
        whyItMatters: doc.whyItMatters,
        caveat: doc.caveat,
        tags: doc.tags,
        sourceUrl: doc.sourceUrl,
        score: args.scores[i],
      });
    }
    return out;
  },
});

/**
 * Shared core: embed → vector search → hydrate. Both the public action and
 * the internal mirror call this so the embedding/search/hydration logic
 * lives in exactly one place.
 */
async function performVectorSearch(
  ctx: ActionCtx,
  args: { query: string; limit?: number; category?: RoutineCategory },
): Promise<RoutineSearchHit[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY not set in Convex env — cannot run vector search.",
    );
  }
  const limit = Math.max(1, Math.min(args.limit ?? 5, 20));
  const queryEmbedding = await embedQuery(apiKey, args.query);

  const cat = args.category;
  const results = cat
    ? await ctx.vectorSearch("popularRoutines", "by_embedding", {
        vector: queryEmbedding,
        limit,
        filter: (q) => q.eq("category", cat),
      })
    : await ctx.vectorSearch("popularRoutines", "by_embedding", {
        vector: queryEmbedding,
        limit,
      });

  return await ctx.runQuery(internal.popularRoutines._hydrateHits, {
    ids: results.map((r) => r._id),
    scores: results.map((r) => r._score),
  });
}

/**
 * Public action: vector search over the embedded routines. Used by both the
 * chat API (for RAG context) and the eval harness.
 */
export const vectorSearch = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args): Promise<RoutineSearchHit[]> => {
    return performVectorSearch(ctx, args);
  },
});

// ---------------------------------------------------------------------------
// Eval harness
// ---------------------------------------------------------------------------

export type EvalCase = {
  query: string;
  // Slugs we'd be happy to see in the top-K results. The case passes if at
  // least one expected slug appears in the top `topK` hits.
  expectedAnyOf: string[];
};

export type EvalRunResult = {
  query: string;
  expectedAnyOf: string[];
  topHits: Array<{ slug: string; score: number }>;
  passed: boolean;
};

/**
 * Run an array of eval queries and report which pass. Used by the dev loop
 * to validate RAG quality before shipping. Defaults to the curated suite.
 */
export const runEvals = internalAction({
  args: {
    cases: v.optional(
      v.array(
        v.object({
          query: v.string(),
          expectedAnyOf: v.array(v.string()),
        }),
      ),
    ),
    topK: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    passed: number;
    failed: number;
    results: EvalRunResult[];
  }> => {
    const cases: EvalCase[] = args.cases ?? DEFAULT_EVAL_CASES;
    const topK = args.topK ?? 3;
    const results: EvalRunResult[] = [];

    for (const c of cases) {
      const hits: RoutineSearchHit[] = await ctx.runAction(
        internal.popularRoutines.vectorSearchInternal,
        { query: c.query, limit: topK },
      );
      const topHits = hits.map((h) => ({ slug: h.slug, score: h.score }));
      const passed = topHits.some((h) => c.expectedAnyOf.includes(h.slug));
      results.push({
        query: c.query,
        expectedAnyOf: c.expectedAnyOf,
        topHits,
        passed,
      });
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    console.log(`[evals] ${passed}/${results.length} passed`);
    for (const r of results) {
      const status = r.passed ? "PASS" : "FAIL";
      console.log(
        `[evals] ${status} "${r.query}" -> ${r.topHits
          .map((h) => `${h.slug}(${h.score.toFixed(3)})`)
          .join(", ")} (expected one of: ${r.expectedAnyOf.join(", ")})`,
      );
    }

    return { passed, failed, results };
  },
});

/**
 * Internal mirror of `vectorSearch` so `runEvals` can call it via
 * `runAction` without needing public-action type juggling.
 */
export const vectorSearchInternal = internalAction({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args): Promise<RoutineSearchHit[]> => {
    return performVectorSearch(ctx, args);
  },
});

/**
 * 20 representative user intents with the slugs we'd expect a sensible RAG
 * to surface. Used by `runEvals`. Update freely as the catalog evolves.
 */
export const DEFAULT_EVAL_CASES: EvalCase[] = [
  {
    query: "I want to do the hardest mental toughness challenge",
    expectedAnyOf: ["75-hard-challenge", "monk-mode-30-60-90-day", "winter-arc-great-lock-in"],
  },
  {
    query: "I'm a working parent and want a realistic 75-day challenge",
    expectedAnyOf: ["75-medium-challenge", "75-soft-challenge"],
  },
  {
    query: "Help me start running from zero",
    expectedAnyOf: ["couch-to-5k-c25k"],
  },
  {
    query: "Best way to get 10000 steps a day",
    expectedAnyOf: [
      "hot-girl-walk-10k-steps",
      "12-3-30-treadmill",
      "rucking-weighted-vest-walking",
    ],
  },
  {
    query: "I want to learn Japanese using anime and flashcards",
    expectedAnyOf: ["refold-immersion-anki-srs", "duolingo-daily-streak", "pimsleur-30-min-daily"],
  },
  {
    query: "How do I build a daily coding habit and prep for FAANG interviews",
    expectedAnyOf: ["100-days-of-code", "leetcode-daily-challenge", "codewars-katas-build-in-public"],
  },
  {
    query: "Routine to write a novel in November",
    expectedAnyOf: ["nanowrimo-write-a-novel-in-november"],
  },
  {
    query: "I want to journal and unlock creativity in the morning",
    expectedAnyOf: ["morning-pages-julia-cameron", "5-minute-journal-daily-stoic", "gratitude-stoic-journaling"],
  },
  {
    query: "Best focus method for cognitively demanding work",
    expectedAnyOf: ["cal-newport-deep-work-blocks", "pomodoro-25-5", "flowmodoro-flowtime", "90-20-ultradian-rhythm"],
  },
  {
    query: "Plan every minute of my day on the calendar",
    expectedAnyOf: ["time-blocking-newport-musk", "themed-days", "ivy-lee-method-6-priorities"],
  },
  {
    query: "I want to wake up at 5 AM and have a structured morning",
    expectedAnyOf: [
      "miracle-morning-savers",
      "5-am-club-20-20-20",
      "founder-ceo-morning-stack",
      "huberman-morning-protocol",
    ],
  },
  {
    query: "Science-backed morning routine with sunlight and cold exposure",
    expectedAnyOf: [
      "huberman-morning-protocol",
      "wim-hof-method-20-day-cold-plunge",
      "cold-exposure",
      "sauna-protocol-huberman-heat",
    ],
  },
  {
    query: "I want to read more books this year",
    expectedAnyOf: ["goodreads-reading-challenge"],
  },
  {
    query: "Help me cut back on alcohol",
    expectedAnyOf: ["dry-january-sober-october-no-sugar", "sober-curious-mindful-drinking"],
  },
  {
    query: "Build a strength training split for hypertrophy",
    expectedAnyOf: ["ppl-push-pull-legs-split", "crossfit-daily-wod"],
  },
  {
    query: "I want to learn guitar consistently",
    expectedAnyOf: ["justinguitar-daily-practice", "deliberate-practice-framework"],
  },
  {
    query: "I keep getting distracted by my phone — help me detox",
    expectedAnyOf: [
      "digital-detox-dopamine-fasting",
      "dumb-phone-calm-tech-challenge",
      "monk-mode-30-60-90-day",
    ],
  },
  {
    query: "How do I save more money this year",
    expectedAnyOf: ["no-spend-saving-plans"],
  },
  {
    query: "I want to meditate daily for stress relief",
    expectedAnyOf: ["daily-meditation", "gratitude-stoic-journaling"],
  },
  {
    query: "30-day clean eating reset to identify food sensitivities",
    expectedAnyOf: ["whole30", "intermittent-fasting-16-8-omad-5-2"],
  },
];
