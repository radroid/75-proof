"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoachAttachmentMenu } from "./CoachAttachmentMenu";
import {
  CoachAttachmentChip,
  type RoutineAttachment,
} from "./CoachAttachmentChip";

const MAX_TEXTAREA_HEIGHT = 200;

export function CoachComposer({
  value,
  onChange,
  onSubmit,
  pending,
  attachment,
  onAttach,
  onClearAttachment,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  pending: boolean;
  attachment: RoutineAttachment | null;
  onAttach: (att: RoutineAttachment) => void;
  onClearAttachment: () => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!pending && value.trim()) onSubmit();
    }
  };

  const canSend = !pending && value.trim().length > 0;

  return (
    <div className="pointer-events-none w-full px-3">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl">
        {attachment && (
          <div className="mb-1.5 flex justify-start pl-1">
            <CoachAttachmentChip
              attachment={attachment}
              onClear={onClearAttachment}
            />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) onSubmit();
          }}
          className={cn(
            "flex items-end gap-2 rounded-3xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur",
            "supports-[backdrop-filter]:bg-background/80",
          )}
        >
          <CoachAttachmentMenu onPick={onAttach} disabled={pending} />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            rows={1}
            disabled={pending}
            className={cn(
              // text-base (16px) on mobile prevents iOS Safari from
              // auto-zooming the viewport when the textarea takes focus —
              // sub-16px form controls trigger that zoom on iPhones.
              // Desktop drops to text-sm to match the rest of the chat UI.
              "max-h-[200px] flex-1 resize-none bg-transparent px-1 py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground sm:text-sm",
              // Hide the intrinsic textarea scrollbar so it doesn't render
              // a thin gray line next to the send button. We auto-grow the
              // textarea up to max-h, and at max-h the cursor stays in
              // view via the browser's caret-tracking.
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "disabled:opacity-60",
            )}
          />

          <button
            type="submit"
            aria-label="Send message"
            disabled={!canSend}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground",
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
