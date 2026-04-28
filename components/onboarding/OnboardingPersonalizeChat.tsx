"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { usePersonalizeChat } from "@/lib/llm-personalize";
import type { OnboardingHabit } from "@/lib/onboarding-types";
import { PROPOSAL_SENTINEL } from "@/convex/lib/llmPrompts";

interface Props {
  selectedTemplateSlug: string;
  onClose: () => void;
  onApplyProposal: (proposal: {
    title: string;
    daysTotal: number;
    habits: OnboardingHabit[];
    strictMode: boolean;
  }) => void;
}

const SUGGESTED_PROMPTS = [
  "Desk worker, 30 min/day, hate cardio. Build me something I can do at home.",
  "Want to lose 10 lb in 3 months. I have a gym and 1 hour each morning.",
  "Burnt out from 75 HARD. Need a softer 60-day reset focused on sleep + mood.",
];

const STARTER_MESSAGE =
  "Hey — I'm your routine coach. Tell me what you want to build " +
  "and I'll draft a plan you can refine. Goals, schedule, equipment, " +
  "what's worked or failed before — all useful.";

/**
 * Full-screen onboarding chat. The composer is sticky to the bottom; the
 * transcript scrolls inside the available space; the proposal card slides
 * in above the composer when the model emits one. Three suggested
 * prompts seed the empty state so the user has something to click.
 */
export function OnboardingPersonalizeChat({
  selectedTemplateSlug,
  onClose,
  onApplyProposal,
}: Props) {
  const { messages, proposal, pending, error, send, reset } =
    usePersonalizeChat(selectedTemplateSlug);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the transcript to the latest message whenever something new
  // arrives (user turn, assistant turn, or pending indicator). Without this
  // the user has to scroll manually after every reply.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, pending, proposal]);

  const handleSend = async (text: string) => {
    const value = text.trim();
    if (!value || pending) return;
    setDraft("");
    await send(value);
  };

  const handleApply = () => {
    if (!proposal) return;
    const habits: OnboardingHabit[] = proposal.habits.map((h, i) => ({
      name: h.name,
      blockType: h.blockType,
      target: h.target ?? undefined,
      unit: h.unit ?? undefined,
      isHard: h.isHard,
      isActive: true,
      category: h.category,
      sortOrder: h.sortOrder ?? i + 1,
      icon: h.icon,
    }));
    onApplyProposal({
      title: proposal.title,
      daysTotal: proposal.daysTotal,
      habits,
      strictMode: proposal.strictMode,
    });
  };

  const showEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* Sticky chat header. Stays put as the transcript scrolls so the back
          and reset affordances are always reachable. */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-1 -ml-2 min-h-[44px]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Routine coach
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={messages.length === 0 && !proposal}
          className="gap-1 -mr-2 min-h-[44px]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>

      {/* Scrollable transcript. `min-h-0` is critical so the flex child can
          actually shrink and let `overflow-y-auto` engage. */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4"
      >
        <div className="mx-auto max-w-2xl space-y-3">
          {showEmpty && (
            <div className="space-y-4 py-6">
              <ChatBubble role="assistant" content={STARTER_MESSAGE} />
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/70 px-1">
                  Try one of these
                </p>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    disabled={pending}
                    className="w-full text-left rounded-xl border border-border px-3.5 py-2.5 text-sm transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatBubble
              key={i}
              role={m.role === "user" ? "user" : "assistant"}
              content={stripSentinelBlock(m.content)}
            />
          ))}

          {pending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Thinking…
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Proposal card + composer pinned to the bottom. Wrapped in a single
          container so they share the safe-area inset and the proposal slides
          in above the composer without reflowing the whole page. */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {proposal && (
          <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-3">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{proposal.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {proposal.summary}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {proposal.daysTotal} days · {proposal.difficulty} ·{" "}
                    {proposal.habits.length} habits
                    {proposal.strictMode ? " · strict" : ""}
                  </p>
                </div>
                <Button size="sm" onClick={handleApply} className="shrink-0">
                  Use this
                </Button>
              </div>
            </div>
          </div>
        )}

        <form
          className="mx-auto max-w-2xl flex items-center gap-2 px-4 sm:px-6 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tell the coach what you want…"
            disabled={pending}
            className="flex-1"
            aria-label="Message the coach"
          />
          <Button
            type="submit"
            size="icon"
            disabled={pending || !draft.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Hide the raw sentinel + JSON block from the rendered transcript. */
function stripSentinelBlock(text: string): string {
  // Match parseProposal's "last sentinel wins" rule so revised proposals
  // don't accidentally swallow earlier transcript text that mentions the
  // marker.
  const idx = text.lastIndexOf(PROPOSAL_SENTINEL);
  if (idx === -1) return text;
  return text.slice(0, idx).trimEnd();
}
