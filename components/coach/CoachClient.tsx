"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Loader2, Send, Sparkles, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { cn } from "@/lib/utils";

export type CoachCategory =
  | "fitness"
  | "skill-building"
  | "productivity"
  | "personal-development";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type RetrievedRoutine = {
  slug: string;
  title: string;
  category: CoachCategory;
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

type ChatTurn = {
  id: string;
  user: string;
  assistant?: string;
  retrieved?: RetrievedRoutine[];
  pending?: boolean;
  error?: string;
};

function newTurnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const CATEGORIES: Array<{
  slug: CoachCategory;
  label: string;
  blurb: string;
  accent: string;
  prompts: string[];
}> = [
  {
    slug: "fitness",
    label: "Fitness & physical health",
    blurb: "75 Hard, Hyrox, rucking, cold plunges, walking — body-first programs.",
    accent: "from-orange-500/15 to-rose-500/5",
    prompts: [
      "I want the hardest mental-toughness fitness challenge",
      "I'm a working parent — give me a realistic 75-day program",
      "How do I start running from zero?",
      "What's the best way to hit 10,000 steps daily?",
    ],
  },
  {
    slug: "skill-building",
    label: "Skill-building & mastery",
    blurb: "Coding, languages, music, art, chess, writing — daily-practice rituals.",
    accent: "from-sky-500/15 to-indigo-500/5",
    prompts: [
      "Help me build a daily coding habit and prep for FAANG",
      "I want to learn Japanese using anime and flashcards",
      "Routine to write a novel in November",
      "I want to learn guitar consistently",
    ],
  },
  {
    slug: "productivity",
    label: "Work & productivity",
    blurb: "Deep work, Pomodoro, GTD, time-blocking, AI-first planning.",
    accent: "from-emerald-500/15 to-teal-500/5",
    prompts: [
      "Best focus method for cognitively demanding work",
      "Plan every minute of my day on the calendar",
      "How do I get to inbox zero without burning out?",
      "Build a 12-week-year plan for me",
    ],
  },
  {
    slug: "personal-development",
    label: "Personal development & wellbeing",
    blurb: "Morning routines, journaling, sleep, sober-curious, digital detox.",
    accent: "from-violet-500/15 to-fuchsia-500/5",
    prompts: [
      "Science-backed morning routine with sunlight and cold exposure",
      "Help me cut back on alcohol",
      "I want to read more books this year",
      "I keep getting distracted by my phone — help me detox",
    ],
  },
];

export function CoachClient() {
  const [category, setCategory] = useState<CoachCategory | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      const newTurn: ChatTurn = { id: newTurnId(), user: trimmed, pending: true };
      const nextTurns = [...turns, newTurn];
      setTurns(nextTurns);
      setDraft("");
      setPending(true);

      const messages: ChatMessage[] = nextTurns.flatMap((t) => {
        const arr: ChatMessage[] = [{ role: "user", content: t.user }];
        if (t.assistant) arr.push({ role: "assistant", content: t.assistant });
        return arr;
      });

      try {
        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            category: category ?? undefined,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          assistantText: string;
          retrieved: RetrievedRoutine[];
        };
        setTurns((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = {
            ...last,
            pending: false,
            assistant: data.assistantText,
            retrieved: data.retrieved,
          };
          return copy;
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        setTurns((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, pending: false, error: message };
          return copy;
        });
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setPending(false);
        }
      }
    },
    [turns, pending, category],
  );

  const handleCategoryPick = (slug: CoachCategory) => {
    setCategory(slug);
  };

  const handleReset = () => {
    setTurns([]);
    setCategory(null);
    setDraft("");
  };

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.slug === category) ?? null,
    [category],
  );

  const showCategoryPicker = turns.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Routine Coach</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Chat with an AI that&apos;s read the deep-research playbook on 80+ widely-followed
          routines (75 Hard, Huberman, Pomodoro, Atomic Habits, and more) and can help you pick or
          stack the right one for your goals.
        </p>
      </header>

      {showCategoryPicker && (
        <section aria-labelledby="categories-heading" className="space-y-3">
          <h2 id="categories-heading" className="text-sm font-medium text-muted-foreground">
            Pick a category to focus the conversation — or just start typing.
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => {
              const selected = category === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleCategoryPick(c.slug)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary ring-1 ring-primary" : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 -z-10 bg-gradient-to-br opacity-80",
                      c.accent,
                    )}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">{c.label}</h3>
                      <p className="text-sm text-muted-foreground">{c.blurb}</p>
                    </div>
                    {selected ? (
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {activeCategory && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Try:
              </span>
              {activeCategory.prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={pending}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-accent disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {activeCategory ? activeCategory.label : "Open conversation"}
            </CardTitle>
            <CardDescription>
              {activeCategory
                ? activeCategory.blurb
                : "Ask anything about routines, habits, or stacking challenges."}
            </CardDescription>
          </div>
          {(turns.length > 0 || category) && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            ref={scrollRef}
            className="max-h-[55vh] min-h-[220px] space-y-4 overflow-y-auto rounded-md border bg-muted/30 p-4"
          >
            {turns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Describe what you want — your goals, time budget, what&apos;s worked or failed
                before. The coach will pull from the catalog and tell you which routines fit.
              </p>
            )}
            {turns.map((t) => (
              <ChatTurnView key={t.id} turn={t} />
            ))}
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                activeCategory
                  ? `Ask about ${activeCategory.label.toLowerCase()}…`
                  : "Ask the coach…"
              }
              disabled={pending}
              className="flex-1"
            />
            <Button type="submit" disabled={pending || !draft.trim()} size="sm">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Send</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ChatTurnView({ turn }: { turn: ChatTurn }) {
  return (
    <div className="space-y-2">
      <ChatBubble role="user" content={turn.user} />

      {turn.pending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pl-1">
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          Searching the catalog and thinking…
        </div>
      )}

      {turn.error && (
        <p className="text-sm text-destructive pl-1">Error: {turn.error}</p>
      )}

      {turn.assistant && (
        <ChatBubble role="assistant" content={turn.assistant} />
      )}

      {/* Only render retrieved routines once the turn has settled
          (assistant text or an error). Keeps partial state from showing
          while a request is mid-flight, but still surfaces the catalog
          matches when the LLM call itself failed. */}
      {(turn.assistant || turn.error) && turn.retrieved && turn.retrieved.length > 0 && (
        <RetrievedRoutinesList routines={turn.retrieved} />
      )}
    </div>
  );
}

function RetrievedRoutinesList({ routines }: { routines: RetrievedRoutine[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Top matches from the catalog
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {routines.slice(0, 4).map((r) => (
          <details
            key={r.slug}
            className="group rounded-md border bg-background p-3 text-sm"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <div className="space-y-0.5">
                <p className="font-medium leading-tight">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {humanizeCategory(r.category)} • {r.duration}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {formatSimilarityPercent(r.score)}%
              </Badge>
            </summary>
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              <p>{r.summary}</p>
              {r.trackingChecklist.length > 0 && (
                <div>
                  <p className="font-medium text-foreground/80">Track:</p>
                  <ul className="ml-4 list-disc">
                    {r.trackingChecklist.slice(0, 6).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {r.caveat && (
                <p className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-amber-700 dark:text-amber-300">
                  <span className="font-medium">Caveat:</span> {r.caveat}
                </p>
              )}
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

// Maps a Convex vector-search cosine similarity in the [-1, 1] range
// to a 0–100% display number. If the upstream scoring ever changes
// (e.g. dot-product on un-normalized vectors, a different distance
// metric), update this transform.
function formatSimilarityPercent(score: number): number {
  if (
    process.env.NODE_ENV === "development" &&
    (score < -1.01 || score > 1.01)
  ) {
    console.warn(
      `[formatSimilarityPercent] Unexpected score ${score} — expected cosine similarity in [-1, 1]`,
    );
  }
  const pct = Math.round(((score + 1) / 2) * 100);
  return Math.max(0, Math.min(100, pct));
}

function humanizeCategory(c: CoachCategory | string): string {
  switch (c) {
    case "fitness":
      return "Fitness";
    case "skill-building":
      return "Skill-building";
    case "productivity":
      return "Productivity";
    case "personal-development":
      return "Personal development";
    default:
      return c;
  }
}
