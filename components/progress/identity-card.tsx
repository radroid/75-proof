"use client";

import { motion } from "framer-motion";
import {
  pickIdentityTemplate,
  weeklyAnnotation,
  type IdentityCardInput,
} from "@/lib/identity-cards";

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
      className="rounded-2xl border bg-card/40 p-5 md:p-8"
    >
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
        {useUserCopy ? "Your identity" : "Today"}
      </p>
      <p
        className="text-2xl md:text-3xl font-light leading-snug"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {headline}
      </p>
      <p className="mt-4 text-sm text-muted-foreground tabular-nums">
        {annotation}
      </p>
    </motion.div>
  );
}
