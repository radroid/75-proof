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
          "inline-flex items-center justify-center rounded-full border border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-150 min-h-[32px] min-w-[40px] px-2.5 py-1 touch-manipulation active:scale-95",
          triggerClassName,
        ].join(" ")}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick an emoji"
          className="absolute z-20 bottom-full mb-2 left-0 w-64 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover text-popover-foreground shadow-lg p-2"
        >
          <div className="flex items-center justify-between gap-2 pb-1.5">
            <span className="pl-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Pick an emoji
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close emoji picker"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 touch-manipulation active:scale-95 transition-transform -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pick(emoji)}
                className="aspect-square min-h-[40px] rounded-md text-xl hover:bg-muted active:scale-90 active:bg-muted transition-transform touch-manipulation"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
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
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 min-w-0 h-10 rounded-md border bg-background px-2.5 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              maxLength={16}
            />
            <button
              type="button"
              onClick={() => pick(custom)}
              disabled={!custom.trim()}
              className="h-10 rounded-md px-3 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:pointer-events-none hover:opacity-90 touch-manipulation active:scale-95 transition-transform"
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
