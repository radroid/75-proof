"use client";

import * as React from "react";
import {
  Palette,
  CalendarDays,
  Bell,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useThemePersonality } from "@/components/theme-provider";
import { PaletteEarned } from "./palette";
import { CalendarDaysEarned } from "./calendar-days";
import { BellEarned } from "./bell";
import { ShieldEarned } from "./shield";

// Named lookup of icon variants. Each entry pairs the Lucide
// fallback (used on every non-Earned theme) with the hand-drawn
// Earned variant. Add new icons as additional entries — keep both
// renderers' API matching `className` so the swap is invisible to
// callers.

type IconName = "palette" | "calendar-days" | "bell" | "shield";

const variants: Record<
  IconName,
  {
    lucide: LucideIcon;
    earned: React.ComponentType<{ className?: string }>;
  }
> = {
  palette: { lucide: Palette, earned: PaletteEarned },
  "calendar-days": { lucide: CalendarDays, earned: CalendarDaysEarned },
  bell: { lucide: Bell, earned: BellEarned },
  shield: { lucide: Shield, earned: ShieldEarned },
};

// Theme-aware icon. Renders the hand-drawn variant under Earned;
// falls through to the Lucide default everywhere else so arctic /
// broadsheet / military / zen keep their visual language.
export function ThemedIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const { personality } = useThemePersonality();
  const v = variants[name];
  if (personality === "earned") {
    return <v.earned className={className} />;
  }
  const Lucide = v.lucide;
  return <Lucide className={className} />;
}
