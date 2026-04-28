"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquareText, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  coach: "Coach",
  imported: "Imported",
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      new Date(ts).getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  });
}

export function CoachRecentsSheet({
  open,
  onClose,
  onLoadThread,
  onNewChat,
  activeThreadId,
}: {
  open: boolean;
  onClose: () => void;
  onLoadThread: (threadId: Id<"coachThreads">) => void;
  onNewChat: () => void;
  activeThreadId: Id<"coachThreads"> | null;
}) {
  const threads = useQuery(api.coach.listThreads, open ? {} : "skip");
  const deleteThread = useMutation(api.coach.deleteThread);
  const [busyId, setBusyId] = useState<Id<"coachThreads"> | null>(null);

  const handleDelete = async (threadId: Id<"coachThreads">) => {
    if (!confirm("Delete this conversation? This can't be undone.")) return;
    setBusyId(threadId);
    try {
      await deleteThread({ threadId });
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40"
            aria-hidden
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-label="Recent coach conversations"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "fixed inset-y-0 right-0 z-[61] flex w-[min(360px,90vw)] flex-col bg-background shadow-2xl",
              "border-l border-border",
            )}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Recent chats</h2>
                <p className="text-[11px] text-muted-foreground">
                  Your past coach conversations
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close recents"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="border-b border-border p-3">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                New chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {threads === undefined && (
                <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading conversations…
                </div>
              )}
              {threads && threads.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">
                  No saved conversations yet. Start a new chat to begin.
                </p>
              )}
              {threads && threads.length > 0 && (
                <ul className="divide-y divide-border">
                  {threads.map((t) => {
                    const isActive = activeThreadId === t._id;
                    const isBusy = busyId === t._id;
                    return (
                      <li
                        key={t._id}
                        className={cn(
                          "group relative",
                          isActive && "bg-primary/5",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onLoadThread(t._id);
                            onClose();
                          }}
                          className="flex w-full flex-col gap-0.5 px-4 py-3 pr-12 text-left transition-colors hover:bg-accent"
                        >
                          <p className="truncate text-sm font-medium leading-tight">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            <MessageSquareText className="mr-1 inline h-3 w-3 align-text-bottom" />
                            {t.messageCount} message
                            {t.messageCount === 1 ? "" : "s"} ·{" "}
                            {SOURCE_LABEL[t.source] ?? t.source} ·{" "}
                            {formatDate(t.updatedAt)}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t._id)}
                          aria-label={`Delete ${t.title}`}
                          disabled={isBusy}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
