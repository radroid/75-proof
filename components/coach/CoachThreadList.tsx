"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MessageSquareText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

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

const SOURCE_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  coach: "Coach",
  imported: "Imported",
};

/**
 * Read-only past-conversations panel for the coach page. Lists every
 * persisted thread (most recent first), lets the user expand one to
 * read its transcript, and delete individual threads. Continuing an
 * old thread isn't supported in this iteration — keep the chat panel
 * focused on new conversations.
 */
export function CoachThreadList() {
  const threads = useQuery(api.coach.listThreads, {});
  const [selected, setSelected] = useState<Id<"coachThreads"> | null>(null);

  if (threads === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading conversations…
      </div>
    );
  }

  if (threads.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        Past conversations
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {threads.map((t) => (
          <li
            key={t._id}
            className="rounded-lg border bg-card p-3 text-sm shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelected(selected === t._id ? null : t._id)
                }
                className="min-w-0 flex-1 text-left"
              >
                <p className="font-medium leading-tight line-clamp-1">
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <MessageSquareText className="inline h-3 w-3 mr-1 align-text-bottom" />
                  {t.messageCount} message{t.messageCount === 1 ? "" : "s"}
                  {" · "}
                  {SOURCE_LABEL[t.source] ?? t.source}
                  {" · "}
                  {formatDate(t.updatedAt)}
                </p>
              </button>
              <DeleteThreadButton threadId={t._id} />
            </div>
            {selected === t._id && <ThreadPreview threadId={t._id} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ThreadPreview({ threadId }: { threadId: Id<"coachThreads"> }) {
  const data = useQuery(api.coach.getThread, { threadId });
  if (data === undefined) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading…
      </div>
    );
  }
  if (data === null) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">Thread not found.</p>
    );
  }
  return (
    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-2">
      {data.messages.map((m) => (
        <ChatBubble key={m._id} role={m.role} content={m.content} />
      ))}
    </div>
  );
}

function DeleteThreadButton({ threadId }: { threadId: Id<"coachThreads"> }) {
  const deleteThread = useMutation(api.coach.deleteThread);
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (!confirm("Delete this conversation? This can't be undone.")) return;
    setBusy(true);
    try {
      await deleteThread({ threadId });
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={busy}
      aria-label="Delete conversation"
      className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
