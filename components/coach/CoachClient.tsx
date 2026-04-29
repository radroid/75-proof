"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { History, Loader2 } from "lucide-react";
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
  // Animate the assistant text with a typewriter reveal. Set true for
  // freshly-arrived replies, left undefined for turns hydrated from
  // history so old transcripts don't re-animate on thread switch.
  fresh?: boolean;
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

  // The dashboard layout's <main> wraps every route in
  // `overflow-auto scrollbar-gutter-stable` so other pages don't shift when
  // their scrollbar appears. The coach owns its own scrolling region (the
  // transcript), so on this route main's scrollbar is duplicate chrome —
  // the user sees two thumbs and a permanent reserved gutter on the right.
  // Suppress it for the lifetime of the coach page and restore on unmount.
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prevOverflow = main.style.overflow;
    const prevGutter = main.style.scrollbarGutter;
    main.style.overflow = "hidden";
    main.style.scrollbarGutter = "auto";
    return () => {
      main.style.overflow = prevOverflow;
      main.style.scrollbarGutter = prevGutter;
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
            fresh: true,
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

  const composerNode = (
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
  );

  return (
    <div
      className={cn(
        // Break out of the parent layout's padding so the chat is
        // full-bleed inside <main>. The dashboard layout wraps children
        // in `p-4 pb-[calc(var(--bottom-nav-gap)+1rem)] md:p-8 md:pb-8`,
        // so we negate that here.
        "-m-4 md:-m-8",
        // Height matches the parent's available content area so <main>
        // doesn't get its own scrollbar on top of the transcript's.
        // Mobile: subtract bottom-nav-gap (the parent's pb consumes only
        // 1rem of the negative margin, leaving the gap as overflow).
        // Desktop: -m-8 fully consumes p-8 padding, so no extra subtract.
        "flex flex-col overflow-hidden",
        "h-[calc(100dvh-env(safe-area-inset-top)-var(--bottom-nav-gap))]",
        "md:h-[calc(100dvh-env(safe-area-inset-top))]",
      )}
    >
      <button
        type="button"
        onClick={() => setRecentsOpen(true)}
        aria-label="Recent chats"
        className={cn(
          "fixed right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full",
          "border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur",
          "supports-[backdrop-filter]:bg-background/60 hover:bg-accent hover:text-foreground",
        )}
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <History className="h-4 w-4" />
      </button>

      <div
        ref={transcriptRef}
        className={cn(
          "flex-1 overflow-y-auto px-3",
          isEmpty
            ? "pt-[calc(env(safe-area-inset-top,0px)+3.5rem)]"
            : "pt-[calc(env(safe-area-inset-top,0px)+3.5rem)] pb-[calc(var(--bottom-nav-gap)+6.25rem)] md:pb-32",
        )}
      >
        {isEmpty ? (
          <CoachEmptyState
            onPick={handleSuggestion}
            disabled={pending}
            composer={composerNode}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 py-3">
            {turns.map((t) => (
              <ChatTurnView key={t.id} turn={t} />
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-30",
            // Sit just above the floating mobile nav. `--bottom-nav-gap`
            // already includes the safe-area inset, so the only extra is a
            // 0.25rem hairline gap that prevents the composer pill from
            // touching the nav. Desktop has no floating nav (md:hidden), so
            // a constant 1rem from the viewport bottom is enough.
            "bottom-[calc(var(--bottom-nav-gap)+0.25rem)] md:bottom-4",
          )}
        >
          {composerNode}
        </div>
      )}

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

function ChatTurnView({ turn }: { turn: ChatTurn }) {
  const displayed = useTypewriter(turn.assistant, !!turn.fresh);
  const assistantRef = useRef<HTMLDivElement | null>(null);

  // Keep the bottom of the answer in view as the typewriter prints. The
  // outer transcript only auto-scrolls when `turns` changes; without this
  // ref the user has to chase the growing reply by hand on mobile.
  useEffect(() => {
    if (!turn.fresh || !turn.assistant) return;
    assistantRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [displayed, turn.fresh, turn.assistant]);

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
        <div ref={assistantRef}>
          <ChatBubble role="assistant" content={displayed} />
        </div>
      )}
    </div>
  );
}

/**
 * Reveal `content` character-by-character when `animate` is true; otherwise
 * snap to the full string. The reveal is paced to ~25 chars per tick at
 * 20ms intervals (≈800ms for a 1k-char reply), which feels like fast typing
 * without dragging out long answers. Cleans up its interval on unmount and
 * on input change so old animations don't bleed into a swapped thread.
 */
function useTypewriter(content: string | undefined, animate: boolean): string {
  const [displayed, setDisplayed] = useState<string>(() =>
    animate ? "" : content ?? "",
  );

  useEffect(() => {
    if (!content) {
      setDisplayed("");
      return;
    }
    if (!animate) {
      setDisplayed(content);
      return;
    }
    setDisplayed("");
    let index = 0;
    const total = content.length;
    const charsPerTick = Math.max(2, Math.ceil(total / 80));
    const id = window.setInterval(() => {
      index = Math.min(total, index + charsPerTick);
      setDisplayed(content.slice(0, index));
      if (index >= total) window.clearInterval(id);
    }, 20);
    return () => window.clearInterval(id);
  }, [content, animate]);

  return displayed;
}

function extractAttachmentTitle(content: string): string | null {
  const match = content.match(/^\[Looking at routine: ([^—\]]+)/);
  if (!match) return null;
  return match[1].trim();
}
