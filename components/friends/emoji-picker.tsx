"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  const [placement, setPlacement] = useState<{
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
  }>({ vertical: "top", horizontal: "left" });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Decide which direction the popover opens so it never clips the viewport.
  useIsoLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const POPOVER_H = 280; // approx; close enough for placement
    const POPOVER_W = 260;

    const spaceAbove = rect.top;
    const spaceBelow = viewportH - rect.bottom;
    const vertical: "top" | "bottom" =
      spaceAbove >= POPOVER_H || spaceAbove >= spaceBelow ? "top" : "bottom";

    // If the trigger is in the right half of the viewport (or would clip
    // on the right), anchor the popover's right edge to the trigger's right.
    const wouldClipRight = rect.left + POPOVER_W > viewportW - 8;
    const horizontal: "left" | "right" = wouldClipRight ? "right" : "left";

    setPlacement({ vertical, horizontal });
  }, [open]);

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
    if (!open) {
      setCustom("");
      return;
    }
    // Only auto-focus the input on pointer-fine devices (desktop). On touch
    // devices this would pop the virtual keyboard immediately and cover the
    // emoji grid, which is the main affordance.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
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
        ref={triggerRef}
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
          className={[
            "absolute z-20 w-64 max-w-[min(16rem,calc(100vw-1.5rem))] rounded-lg border bg-popover text-popover-foreground shadow-lg p-2",
            placement.vertical === "top" ? "bottom-full mb-2" : "top-full mt-2",
            placement.horizontal === "left" ? "left-0" : "right-0",
          ].join(" ")}
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
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
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
