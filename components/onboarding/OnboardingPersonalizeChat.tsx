"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

/**
 * Minimal non-streaming chat panel. Sends each turn through the Convex
 * `personalize.chat` action and renders the conversation as plain text.
 * When the latest assistant message includes a sentinel-tagged routine
 * proposal, shows a "Use this routine" button that hands the parsed
 * habits/days back to the onboarding page.
 */
export function OnboardingPersonalizeChat({
  selectedTemplateSlug,
  onClose,
  onApplyProposal,
}: Props) {
  const { messages, proposal, pending, error, send, reset } =
    usePersonalizeChat(selectedTemplateSlug);
  const [draft, setDraft] = useState("");

  const handleSend = async () => {
    const text = draft;
    setDraft("");
    await send(text);
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

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Build a routine with AI
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto rounded-md border bg-muted/30 p-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Tell me about your goals, schedule, and what&apos;s worked or
              failed before. I&apos;ll either pick a template or design
              something fresh.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-xs uppercase tracking-wider mr-2 opacity-70">
                {m.role === "user" ? "You" : "AI"}
              </span>
              {stripSentinelBlock(m.content)}
            </div>
          ))}
          {pending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Thinking…
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">Error: {error}</p>
          )}
        </div>

        {proposal && (
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-2">
            <p className="font-medium text-sm">{proposal.title}</p>
            <p className="text-xs text-muted-foreground">{proposal.summary}</p>
            <p className="text-xs text-muted-foreground/70">
              {proposal.daysTotal} days · {proposal.difficulty} ·{" "}
              {proposal.habits.length} habits
              {proposal.strictMode ? " · strict" : ""}
            </p>
            <Button size="sm" onClick={handleApply}>
              Use this routine
            </Button>
          </div>
        )}

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. desk worker, 30 min/day, hate cardio"
            disabled={pending}
          />
          <Button type="submit" disabled={pending || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
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
