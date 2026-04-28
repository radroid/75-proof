"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { usePersonalizeChat } from "@/lib/llm-personalize";
import type { OnboardingHabit } from "@/lib/onboarding-types";
import { PROPOSAL_SENTINEL } from "@/convex/lib/llmPrompts";
import { api } from "@/convex/_generated/api";

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
  // C-2: when the user accepts the AI-built routine, capture the
  // onboarding chat as a coach thread so the conversation is preserved.
  // Fire-and-forget — failure here must not block onboarding.
  const createThread = useMutation(api.coach.createThread);

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

    // Auto-promote the onboarding chat into a coach thread. Skip if
    // there's no exchange yet (defensive — applying without messages
    // would mean a stub-mode proposal). Strip the sentinel + JSON
    // proposal block from assistant turns so the persisted transcript
    // matches what the user actually saw, not the raw payload.
    if (messages.length > 0) {
      void createThread({
        title: `Onboarding: ${proposal.title}`.slice(0, 80),
        source: "onboarding",
        initialMessages: messages.map((m) => ({
          role: m.role,
          content:
            m.role === "assistant" ? stripSentinelBlock(m.content) : m.content,
        })),
      }).catch((err) => {
        console.error("[onboarding] thread persist failed", err);
      });
    }

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

        <div className="space-y-2 max-h-80 overflow-y-auto rounded-md border bg-background/40 p-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Tell me about your goals, schedule, and what&apos;s worked or
              failed before. I&apos;ll either pick a template or design
              something fresh.
            </p>
          )}
          {messages.map((m, i) => (
            <ChatBubble
              key={i}
              role={m.role === "user" ? "user" : "assistant"}
              content={stripSentinelBlock(m.content)}
            />
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
          <Button
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
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
