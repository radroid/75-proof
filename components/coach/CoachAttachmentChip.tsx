"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoutineAttachment = {
  slug: string;
  title: string;
  category: string;
  duration?: string;
};

export function buildAttachmentPreamble(att: RoutineAttachment): string {
  const meta = [att.category, att.duration].filter(Boolean).join(", ");
  return `[Looking at routine: ${att.title}${meta ? ` — ${meta}` : ""}]`;
}

const PREAMBLE_PATTERN = /^\[Looking at routine: [^\]]+\]\n+/;

export function stripAttachmentPreamble(content: string): string {
  return content.replace(PREAMBLE_PATTERN, "");
}

export function CoachAttachmentChip({
  attachment,
  onClear,
  size = "md",
}: {
  attachment: RoutineAttachment;
  onClear?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="max-w-[180px] truncate font-medium">{attachment.title}</span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove ${attachment.title} attachment`}
          className="ml-0.5 rounded-full p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
