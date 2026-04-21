"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

const POPULAR_EMOJIS: string[] = [
  "🔥", "💪", "👏", "❤️", "🎉", "🙌",
  "⭐", "💯", "🏆", "😎", "🤩", "🚀",
  "✨", "💥", "👊", "🥳", "🫡", "👑",
  "🌟", "💎", "🦾", "🏅", "☀️", "🌈",
];

export function EmojiPicker({
  onPick,
  triggerClassName = "",
  ariaLabel = "Add a reaction",
}: {
  onPick: (emoji: string) => void;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Focus input after a tick so the popover is on screen
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    } else {
      setCustom("");
    }
  }, [open]);

  const pick = (emoji: string) => {
    const trimmed = emoji.trim();
    if (!trimmed) return;
    onPick(trimmed);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={[
          "inline-flex items-center justify-center rounded-full border border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors min-h-[28px] min-w-[28px] px-2 py-0.5",
          triggerClassName,
        ].join(" ")}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick an emoji"
          className="absolute z-20 bottom-full mb-2 left-0 w-64 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover text-popover-foreground shadow-lg p-2"
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Pick an emoji
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close emoji picker"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-0.5">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pick(emoji)}
                className="aspect-square rounded-md text-lg hover:bg-muted active:scale-95 transition-transform"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value.slice(0, 16))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && custom.trim()) {
                  e.preventDefault();
                  pick(custom);
                }
              }}
              placeholder="Type or paste any emoji"
              aria-label="Custom emoji"
              className="flex-1 min-w-0 h-8 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              maxLength={16}
            />
            <button
              type="button"
              onClick={() => pick(custom)}
              disabled={!custom.trim()}
              className="h-8 rounded-md px-2 text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:pointer-events-none hover:opacity-90"
            >
              Add
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-muted-foreground/80 leading-tight">
            On mobile, open your emoji keyboard.
          </p>
        </div>
      )}
    </div>
  );
}
