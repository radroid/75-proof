"use client";

import { motion } from "framer-motion";
import { ThemedIcon } from "@/components/earned/icons/themed-icon";
import { EC, HAND, SANS } from "@/components/earned/primitives/tokens";

interface Props {
  rate: number | null;
  consideredDays: number;
  windowDays: number;
  currentStreak: number;
  bestStreak: number;
}

// Cream sticker tile — matches the Today screen's chip vocabulary (ink border
// + hard offset shadow, crisp text). Inline because it carries `EC.*` tokens;
// Tailwind still owns padding/spacing on each tile.
const tileStyle: React.CSSProperties = {
  background: EC.creamLight,
  border: `1.5px solid ${EC.ink}`,
  borderRadius: 12,
  boxShadow: `2px 2px 0 ${EC.ink}`,
};

/**
 * Headline tile pair. Replaces the legacy 6-tile grid:
 *   - Rolling 30-day completion rate as the dominant number (research §3.1).
 *   - Streak chip with current + best subtext.
 *
 * Days 1–6 fall back to "Last {n} days" labelling when the user hasn't
 * accumulated 30 days of data yet (research §7).
 *
 * Earned skin: paper sticker tiles, handwritten (Caveat) protagonist numbers,
 * hand-drawn `ThemedIcon` glyphs. Restyled unconditionally.
 */
export function HeadlineMetrics({
  rate,
  consideredDays,
  windowDays,
  currentStreak,
  bestStreak,
}: Props) {
  const rateLabel =
    consideredDays >= windowDays
      ? `Last ${windowDays} days`
      : `Last ${consideredDays} day${consideredDays === 1 ? "" : "s"}`;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6"
        style={tileStyle}
      >
        <div
          className="flex items-center gap-2 mb-2 min-w-0"
          style={{ color: EC.inkSoft }}
        >
          <ThemedIcon name="trending-up" className="h-4 w-4 shrink-0" />
          <span
            className="text-[10px] tracking-[0.2em] uppercase truncate"
            style={{ fontFamily: SANS, fontWeight: 600, color: EC.inkSoft }}
          >
            Completion
          </span>
        </div>
        <p
          className="text-4xl md:text-6xl tabular-nums leading-none"
          style={{ fontFamily: HAND, fontWeight: 700, color: EC.ink }}
        >
          {rate === null ? "—" : `${Math.round(rate)}`}
          {rate !== null && (
            <span
              className="text-base md:text-2xl ml-1"
              style={{ color: EC.inkSoft }}
            >
              %
            </span>
          )}
        </p>
        <p
          className="mt-2 text-xs"
          style={{ fontFamily: SANS, color: EC.inkSoft }}
        >
          {rateLabel}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-4 md:p-6"
        style={tileStyle}
        aria-label={`Current streak: ${currentStreak} days, best ${bestStreak} days`}
      >
        <div
          className="flex items-center gap-2 mb-2 min-w-0"
          style={{ color: EC.inkSoft }}
        >
          <ThemedIcon name="flame" className="h-4 w-4 shrink-0" />
          <span
            className="text-[10px] tracking-[0.2em] uppercase truncate"
            style={{ fontFamily: SANS, fontWeight: 600, color: EC.inkSoft }}
          >
            Streak
          </span>
        </div>
        <p
          className="text-4xl md:text-6xl tabular-nums leading-none"
          style={{ fontFamily: HAND, fontWeight: 700, color: EC.ink }}
        >
          {currentStreak}
          <span
            className="text-base md:text-2xl ml-1"
            style={{ color: EC.inkSoft }}
          >
            day{currentStreak === 1 ? "" : "s"}
          </span>
        </p>
        <p
          className="mt-2 text-xs tabular-nums"
          style={{ fontFamily: SANS, color: EC.inkSoft }}
        >
          Best: {bestStreak} day{bestStreak === 1 ? "" : "s"}
        </p>
      </motion.div>
    </div>
  );
}
