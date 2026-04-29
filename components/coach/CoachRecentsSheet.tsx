"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MessageSquareText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [pendingDeleteId, setPendingDeleteId] =
    useState<Id<"coachThreads"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pendingDeleteThread = pendingDeleteId
    ? threads?.find((t) => t._id === pendingDeleteId) ?? null
    : null;

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteThread({ threadId: pendingDeleteId });
      toast.success("Conversation deleted");
      setPendingDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <DialogContent
          showCloseButton
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="overflow-hidden p-0 gap-0 sm:max-w-lg w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] h-[85dvh] sm:h-auto sm:max-h-[min(80dvh,640px)]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Recent chats</DialogTitle>
            <DialogDescription>
              Search your past coach conversations
            </DialogDescription>
          </DialogHeader>
          <Command className="h-full **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput
              placeholder="Search recent chats…"
              autoFocus={false}
            />
            <CommandList className="max-h-none flex-1">
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
                      const meta = `${t.messageCount} message${t.messageCount === 1 ? "" : "s"} · ${SOURCE_LABEL[t.source] ?? t.source} · ${formatDate(t.updatedAt)}`;
                      return (
                        <CommandItem
                          key={t._id}
                          value={`${t.title} ${meta}`}
                          onSelect={() => {
                            onLoadThread(t._id);
                            onClose();
                          }}
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
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPendingDeleteId(t._id);
                            }}
                            aria-label={`Delete ${t.title}`}
                            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(next) => {
          if (!next && !isDeleting) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteThread
                ? `“${pendingDeleteThread.title}” will be permanently removed. This can't be undone.`
                : "This conversation will be permanently removed. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
