"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MessageSquareText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

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

  const handleDelete = async (
    e: React.MouseEvent | React.KeyboardEvent,
    threadId: Id<"coachThreads">,
  ) => {
    e.preventDefault();
    e.stopPropagation();
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
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Recent chats"
      description="Search your past coach conversations"
    >
      <CommandInput placeholder="Search recent chats…" />
      <CommandList>
        <CommandEmpty>No conversations match.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            value="new-chat-action"
            onSelect={() => {
              onNewChat();
              onClose();
            }}
          >
            <Plus className="text-foreground" />
            <span className="font-medium">New chat</span>
          </CommandItem>
        </CommandGroup>

        {threads === undefined && (
          <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading conversations…
          </div>
        )}

        {threads && threads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent chats">
              {threads.map((t) => {
                const isActive = activeThreadId === t._id;
                const isBusy = busyId === t._id;
                const meta = `${t.messageCount} message${t.messageCount === 1 ? "" : "s"} · ${SOURCE_LABEL[t.source] ?? t.source} · ${formatDate(t.updatedAt)}`;
                return (
                  <CommandItem
                    key={t._id}
                    value={`${t.title} ${meta}`}
                    onSelect={() => {
                      onLoadThread(t._id);
                      onClose();
                    }}
                    className="group"
                  >
                    <MessageSquareText className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {t.title}
                        {isActive && (
                          <span className="ml-2 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {meta}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, t._id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleDelete(e, t._id);
                        }
                      }}
                      aria-label={`Delete ${t.title}`}
                      disabled={isBusy}
                      className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-data-[selected=true]:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
