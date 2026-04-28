"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Plus, Search, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import type { RoutineAttachment } from "./CoachAttachmentChip";

type CoachCategory =
  | "fitness"
  | "skill-building"
  | "productivity"
  | "personal-development";

const CATEGORY_LABELS: Record<CoachCategory, string> = {
  fitness: "Fitness",
  "skill-building": "Skill-building",
  productivity: "Productivity",
  "personal-development": "Personal development",
};

export function CoachAttachmentMenu({
  onPick,
  disabled,
}: {
  onPick: (attachment: RoutineAttachment) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const me = useQuery(api.users.getCurrentUser);
  const activeChallenge = useQuery(
    api.challenges.getActiveChallenge,
    me ? { userId: me._id } : "skip",
  );
  const popular = useQuery(api.popularRoutines.listAll, open ? {} : "skip");

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (!popular) return [];
    const q = search.trim().toLowerCase();
    if (!q) return popular;
    return popular.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [popular, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      const key = r.category as CoachCategory;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [filtered]);

  const handleActiveChallengePick = () => {
    if (!activeChallenge) return;
    onPick({
      slug: `challenge:${activeChallenge._id}`,
      title: `My current 75 Proof challenge (day ${activeChallenge.currentDay})`,
      category: "fitness",
      duration: `${activeChallenge.daysTotal} days`,
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Attach routine context"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-foreground disabled:opacity-50",
          open && "border-primary text-primary",
        )}
      >
        <Plus className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute bottom-full left-0 z-40 mb-2 w-[min(360px,calc(100vw-2rem))]",
              "rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl",
            )}
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Attach a routine
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The coach will tailor the answer to that routine.
              </p>
            </div>

            {activeChallenge && (
              <button
                type="button"
                onClick={handleActiveChallengePick}
                className="flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">
                    My current challenge
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Day {activeChallenge.currentDay} of {activeChallenge.daysTotal}
                  </p>
                </div>
              </button>
            )}

            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 80+ routines…"
                  className="w-full rounded-md border border-border bg-background pl-7 pr-2 py-1.5 text-xs outline-none ring-0 focus:border-primary"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {!popular && (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading catalog…
                </div>
              )}
              {popular && filtered.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted-foreground">
                  No routines match “{search}”.
                </p>
              )}
              {(Object.keys(grouped) as CoachCategory[]).map((cat) => (
                <div key={cat} className="mb-1">
                  <p className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  {grouped[cat].map((r) => (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => {
                        onPick({
                          slug: r.slug,
                          title: r.title,
                          category: r.category,
                          duration: r.duration,
                        });
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-tight">{r.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {r.duration}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
