"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HandHeart, X } from "lucide-react";
import { haptic } from "@/lib/haptics";

export function IncomingNudges() {
  const nudges = useQuery(api.nudges.getIncomingNudges);
  const markSeen = useMutation(api.nudges.markIncomingNudgesSeen);
  const [dismissing, setDismissing] = useState(false);

  if (!nudges || nudges.length === 0) return null;

  const unique = Array.from(
    new Map(nudges.map((n) => [String(n.from._id), n])).values()
  );
  const preview = unique.slice(0, 3);
  const extra = unique.length - preview.length;

  const names = preview.map((n) => n.from.displayName).join(", ");
  const label =
    unique.length === 1
      ? `${names} nudged you`
      : extra > 0
        ? `${names} +${extra} nudged you`
        : `${names} nudged you`;

  const handleDismiss = async () => {
    haptic("selection");
    setDismissing(true);
    try {
      await markSeen({});
    } catch {
      setDismissing(false);
    }
  };

  return (
    <AnimatePresence>
      {!dismissing && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative"
          role="status"
          aria-live="polite"
        >
          {/* Soft glow halo behind the badge for the "popping" feel */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-primary/25 blur-xl"
          />
          <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary/85 py-2 pl-2 pr-2 shadow-lg shadow-primary/30 ring-1 ring-primary-foreground/10">
            {/* Icon + stacked avatars */}
            <div className="flex items-center shrink-0">
              <motion.div
                initial={{ rotate: -20, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.08 }}
                className="h-9 w-9 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-primary-foreground/20"
              >
                <HandHeart
                  className="h-4 w-4 text-primary-foreground"
                  aria-hidden="true"
                />
              </motion.div>
              <div className="flex -space-x-2 ml-2">
                {preview.map((n) => (
                  <Avatar
                    key={n._id}
                    className="h-7 w-7 border-2 border-primary shadow-sm"
                  >
                    <AvatarImage src={n.from.avatarUrl} alt={n.from.displayName} />
                    <AvatarFallback className="text-[10px] bg-primary-foreground/20 text-primary-foreground">
                      {n.from.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>

            {/* Label */}
            <p className="flex-1 min-w-0 text-sm leading-tight text-primary-foreground">
              <span className="font-semibold break-words">{label}</span>
              <span className="text-primary-foreground/75"> — keep going!</span>
            </p>

            {/* Dismiss */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss nudges"
              className="h-11 w-11 -mr-1 shrink-0 rounded-full flex items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors active:scale-90 touch-manipulation"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
