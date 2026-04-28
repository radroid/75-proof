"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { History, Loader2, Plus, Settings, Sparkles } from "lucide-react";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CoachComposer } from "./CoachComposer";
import { CoachEmptyState } from "./CoachEmptyState";
import { CoachRecentsSheet } from "./CoachRecentsSheet";
import {
  CoachAttachmentChip,
  buildAttachmentPreamble,
  stripAttachmentPreamble,
  type RoutineAttachment,
} from "./CoachAttachmentChip";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type ChatTurn = {
  id: string;
  user: string;
  attachment?: RoutineAttachment;
  assistant?: string;
  pending?: boolean;
  error?: string;
};

function newTurnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function CoachClient() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [threadId, setThreadId] = useState<Id<"coachThreads"> | null>(null);
  const [attachment, setAttachment] = useState<RoutineAttachment | null>(null);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const [loadingThreadId, setLoadingThreadId] =
    useState<Id<"coachThreads"> | null>(null);

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  const createThread = useMutation(api.coach.createThread);
  const loadedThread = useQuery(
    api.coach.getThread,
    loadingThreadId ? { threadId: loadingThreadId } : "skip",
  );

  // Auto-scroll on new turns / pending state changes.
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  // When the user picks a thread from recents, hydrate it into local turns.
  useEffect(() => {
    if (!loadedThread || !loadingThreadId) return;
    const hydrated: ChatTurn[] = [];
    let pendingUser: { content: string; attachment?: RoutineAttachment } | null =
      null;
    for (const m of loadedThread.messages) {
      if (m.role === "user") {
        if (pendingUser) {
          hydrated.push({
            id: newTurnId(),
            user: pendingUser.content,
            attachment: pendingUser.attachment,
          });
        }
        const stripped = stripAttachmentPreamble(m.content);
        const hadAttachment = stripped !== m.content;
        pendingUser = {
          content: stripped,
          attachment: hadAttachment
            ? {
                slug: "loaded",
                title: extractAttachmentTitle(m.content) ?? "Attached routine",
                category: "",
              }
            : undefined,
        };
      } else {
        hydrated.push({
          id: newTurnId(),
          user: pendingUser?.content ?? "",
          attachment: pendingUser?.attachment,
          assistant: m.content,
        });
        pendingUser = null;
      }
    }
    if (pendingUser) {
      hydrated.push({
        id: newTurnId(),
        user: pendingUser.content,
        attachment: pendingUser.attachment,
      });
    }
    setTurns(hydrated);
    setThreadId(loadingThreadId);
    setLoadingThreadId(null);
  }, [loadedThread, loadingThreadId]);

  const send = useCallback(
    async (text: string, sendingAttachment: RoutineAttachment | null) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      const newTurn: ChatTurn = {
        id: newTurnId(),
        user: trimmed,
        attachment: sendingAttachment ?? undefined,
        pending: true,
      };
      const nextTurns = [...turns, newTurn];
      setTurns(nextTurns);
      setDraft("");
      setAttachment(null);
      setPending(true);

      // Outgoing messages: re-attach the routine preamble so the LLM
      // sees the context. The bubble keeps showing the clean text.
      const messages: ChatMessage[] = nextTurns.flatMap((t) => {
        const userContent = t.attachment
          ? `${buildAttachmentPreamble(t.attachment)}\n${t.user}`
          : t.user;
        const arr: ChatMessage[] = [{ role: "user", content: userContent }];
        if (t.assistant) arr.push({ role: "assistant", content: t.assistant });
        return arr;
      });

      let activeThreadId = threadId;
      if (!activeThreadId) {
        try {
          activeThreadId = await createThread({
            title: trimmed.slice(0, 80),
            source: "coach",
          });
          setThreadId(activeThreadId);
        } catch {
          activeThreadId = null;
        }
      }

      try {
        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            threadId: activeThreadId ?? undefined,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { assistantText: string };
        setTurns((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = {
            ...last,
            pending: false,
            assistant: data.assistantText,
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
    [turns, pending, threadId, createThread],
  );

  const handleSubmit = () => {
    void send(draft, attachment);
  };

  const handleSuggestion = (prompt: string) => {
    void send(prompt, attachment);
  };

  const handleNewChat = () => {
    requestControllerRef.current?.abort();
    setTurns([]);
    setDraft("");
    setAttachment(null);
    setThreadId(null);
    setPending(false);
  };

  const handleLoadThread = (id: Id<"coachThreads">) => {
    handleNewChat();
    setLoadingThreadId(id);
  };

  const isEmpty = turns.length === 0;
  const placeholder = useMemo(
    () =>
      attachment
        ? `Ask about ${attachment.title}…`
        : isEmpty
          ? "Ask the coach anything…"
          : "Reply to the coach…",
    [attachment, isEmpty],
  );

  return (
    <div
      className={cn(
        // Break out of the parent layout's padding so the chat is
        // full-bleed inside <main>. The dashboard layout wraps children
        // in `p-4 pb-[calc(var(--bottom-nav-gap)+1rem)] md:p-8 md:pb-8`,
        // so we negate that here.
        "-m-4 md:-m-8",
        "flex h-[calc(100dvh-env(safe-area-inset-top))] flex-col",
      )}
    >
      <CoachHeader
        hasMessages={!isEmpty}
        onOpenRecents={() => setRecentsOpen(true)}
        onNewChat={handleNewChat}
      />

      <div
        ref={transcriptRef}
        className={cn(
          "flex-1 overflow-y-auto px-3 pt-2",
          // Bottom padding clears: composer height + bottom nav gap.
          "pb-[calc(var(--bottom-nav-gap)+5.5rem)] md:pb-32",
        )}
      >
        {isEmpty ? (
          <CoachEmptyState onPick={handleSuggestion} disabled={pending} />
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 py-3">
            {turns.map((t) => (
              <ChatTurnView key={t.id} turn={t} />
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-30",
          // Sit just above the floating mobile nav. On desktop there's
          // no floating nav (md:hidden) so we drop the offset to a small
          // gap from the bottom of the viewport.
          "bottom-[var(--bottom-nav-gap)] md:bottom-4",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <CoachComposer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          pending={pending}
          attachment={attachment}
          onAttach={setAttachment}
          onClearAttachment={() => setAttachment(null)}
          placeholder={placeholder}
        />
      </div>

      <CoachRecentsSheet
        open={recentsOpen}
        onClose={() => setRecentsOpen(false)}
        onLoadThread={handleLoadThread}
        onNewChat={handleNewChat}
        activeThreadId={threadId}
      />
    </div>
  );
}

function CoachHeader({
  hasMessages,
  onOpenRecents,
  onNewChat,
}: {
  hasMessages: boolean;
  onOpenRecents: () => void;
  onNewChat: () => void;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-3 py-2",
        "backdrop-blur supports-[backdrop-filter]:bg-background/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Coach</p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            Your routine partner
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            type="button"
            onClick={onNewChat}
            aria-label="Start a new chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenRecents}
          aria-label="Recent chats"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <History className="h-4 w-4" />
        </button>
        <Link
          href="/dashboard/settings#coach-memory"
          aria-label="Coach memory settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function ChatTurnView({ turn }: { turn: ChatTurn }) {
  return (
    <div className="space-y-1.5">
      {turn.attachment && (
        <div className="flex justify-end">
          <CoachAttachmentChip attachment={turn.attachment} size="sm" />
        </div>
      )}
      <ChatBubble role="user" content={turn.user} />

      {turn.pending && (
        <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
          Thinking…
        </div>
      )}

      {turn.error && (
        <p className="pl-1 text-xs text-destructive">Error: {turn.error}</p>
      )}

      {turn.assistant && (
        <ChatBubble role="assistant" content={turn.assistant} />
      )}
    </div>
  );
}

function extractAttachmentTitle(content: string): string | null {
  const match = content.match(/^\[Looking at routine: ([^—\]]+)/);
  if (!match) return null;
  return match[1].trim();
}
