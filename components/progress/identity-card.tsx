"use client";

import { motion } from "framer-motion";
import {
  pickIdentityTemplate,
  weeklyAnnotation,
  type IdentityCardInput,
} from "@/lib/identity-cards";
import { EC, HAND, SANS } from "@/components/earned/primitives/tokens";

interface Props {
  /** User-authored "I'm becoming…" statement (PD-8). Renders verbatim when set. */
  userStatement?: string | null;
  rolling7CompleteDays: number;
  templateInput: IdentityCardInput;
}

/**
 * Hero card. Renders the user-authored identity statement if set, otherwise
 * picks from the formation-stage template library. Always shows the
 * underlying weekly count beside the narrative copy so it's still useful for
 * screen readers and for users who don't connect with the generated copy
 * (research §6 a11y).
 *
 * Earned skin: a cream sticker card with a hard ink offset shadow and the
 * handwritten (Caveat) headline — the same paper vocabulary as the Today
 * screen's chips (see `EarnedChip`). Restyled unconditionally (the whole app
 * is on the earned theme); Tailwind owns layout/spacing, inline `EC.*` owns
 * the paper palette.
 */
export function IdentityCard({
  userStatement,
  rolling7CompleteDays,
  templateInput,
}: Props) {
  const trimmed = userStatement?.trim() ?? "";
  const useUserCopy = trimmed.length > 0;
  // Onboarding prompts the user with "I'm becoming…" so the input is a noun
  // phrase like "a runner". Punctuation is up to the user — we add a period
  // only if they didn't.
  const headline = useUserCopy
    ? `You're becoming ${trimmed}${/[.!?]$/.test(trimmed) ? "" : "."}`
    : pickIdentityTemplate(templateInput);
  const annotation = weeklyAnnotation(rolling7CompleteDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-5 md:p-8"
      style={{
        background: EC.creamLight,
        border: `1.5px solid ${EC.ink}`,
        borderRadius: 16,
        boxShadow: `3px 3px 0 ${EC.ink}`,
      }}
    >
      <p
        className="text-[10px] tracking-[0.2em] uppercase mb-3"
        style={{ fontFamily: SANS, fontWeight: 600, color: EC.inkSoft }}
      >
        {useUserCopy ? "Your identity" : "Today"}
      </p>
      <p
        className="text-3xl md:text-4xl leading-snug"
        style={{ fontFamily: HAND, fontWeight: 700, color: EC.ink }}
      >
        {headline}
      </p>
      <p
        className="mt-4 text-sm tabular-nums"
        style={{ fontFamily: SANS, color: EC.inkSoft }}
      >
        {annotation}
      </p>
    </motion.div>
  );
}
