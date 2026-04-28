"use client";

import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { formatDateShort, type ChallengePhase } from "@/lib/day-utils";

interface Props {
  startDate: string;
  phase: Extract<ChallengePhase, { kind: "future" }>;
  /**
   * Bare routine label/title (no "your "/"the " prefix) — the component owns
   * the surrounding "Your X starts on …" sentence. Pass `null`/`undefined`
   * when no recognisable label is available; we render a neutral fallback.
   */
  routineLabel?: string | null;
}

/** Strip a leading case-insensitive `your `/`the ` from a callsite that passed
 *  a possessive label, so we don't render "Your your routine". */
function bareLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^(your|the)\s+/i, "").trim();
  return stripped.length > 0 ? stripped : null;
}

/**
 * Pre-start placeholder shown on /dashboard and /dashboard/progress when
 * the user's active challenge has a future `startDate`. Replaces the daily
 * checklist + Progress stat sections — none of which make sense before
 * Day 1 — with a countdown that tightens copy as the day approaches
 * ("Starts in 5 days" → "Starts day after tomorrow" → "Starts tomorrow").
 */
export function ChallengeUpcoming({ startDate, phase, routineLabel }: Props) {
  const bare = bareLabel(routineLabel);
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <CalendarClock className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Upcoming challenge
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {phase.label}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          {bare ? (
            <>
              Your <span className="text-foreground">{bare}</span> starts on{" "}
            </>
          ) : (
            <>Your challenge starts on </>
          )}
          <span className="text-foreground tabular-nums">
            {formatDateShort(startDate)}
          </span>
          .
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          You can change the start date or your routine from{" "}
          <span className="text-foreground">Settings</span> until then.
        </p>
      </motion.div>
    </PageContainer>
  );
}
