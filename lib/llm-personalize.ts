"use client";

import { useCallback, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface RoutineProposalLite {
  title: string;
  summary: string;
  description: string;
  daysTotal: number;
  strictMode: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  habits: Array<{
    name: string;
    blockType: "task" | "counter";
    target?: number | null;
    unit?: string | null;
    isHard: boolean;
    category: string;
    icon: string;
    sortOrder: number;
  }>;
  reasoning: string;
}

export interface UsePersonalizeChat {
  messages: ChatMessage[];
  proposal: RoutineProposalLite | null;
  pending: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Tiny wrapper around the Convex `personalize.chat` action. Holds local
 * conversation state — we don't persist threads to Convex in v1.
 */
export function usePersonalizeChat(
  selectedTemplateSlug?: string,
): UsePersonalizeChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposal, setProposal] = useState<RoutineProposalLite | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Generation token: bumped on reset so a stale in-flight response
  // can't mutate state after the user clears the chat.
  const requestSeq = useRef(0);
  // Synchronous re-entrancy lock: state-based `pending` can lag behind a
  // rapid double-submit in the same frame, letting two requests fire
  // before React commits the first setPending(true). The ref is updated
  // synchronously so the second call short-circuits immediately.
  const inFlightRef = useRef(false);
  const chat = useAction(api.personalize.chat);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || inFlightRef.current) return;
      inFlightRef.current = true;
      const seq = requestSeq.current + 1;
      requestSeq.current = seq;
      const next: ChatMessage[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages(next);
      setPending(true);
      setError(null);
      try {
        const result = await chat({
          messages: next,
          selectedTemplateSlug,
        });
        if (seq !== requestSeq.current) return;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.assistantText },
        ]);
        if (result.proposal) {
          setProposal(result.proposal as RoutineProposalLite);
        }
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setError(
          err instanceof Error ? err.message : "Personalization request failed",
        );
      } finally {
        if (seq === requestSeq.current) {
          setPending(false);
          inFlightRef.current = false;
        }
      }
    },
    [chat, messages, selectedTemplateSlug],
  );

  const reset = useCallback(() => {
    requestSeq.current += 1;
    inFlightRef.current = false;
    setMessages([]);
    setProposal(null);
    setError(null);
    setPending(false);
  }, []);

  return { messages, proposal, pending, error, send, reset };
}
