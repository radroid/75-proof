"use client";

import * as React from "react";
import {
  Palette,
  CalendarDays,
  Bell,
  Shield,
  AlertTriangle,
  Infinity as InfinityIcon,
  Play,
  Settings,
  Smartphone,
  Monitor,
  Trash2,
  HandHeart,
  type LucideIcon,
} from "lucide-react";
import { useThemePersonality } from "@/components/theme-provider";
import { PaletteEarned } from "./palette";
import { CalendarDaysEarned } from "./calendar-days";
import { BellEarned } from "./bell";
import { ShieldEarned } from "./shield";
import { AlertTriangleEarned } from "./alert-triangle";
import { InfinityEarned } from "./infinity";
import { PlayEarned } from "./play";
import { SettingsGearEarned } from "./settings-gear";
import { SmartphoneEarned } from "./smartphone";
import { MonitorEarned } from "./monitor";
import { TrashEarned } from "./trash";
import { PaperAirplaneEarned } from "./paper-airplane";

// Named lookup of icon variants. Each entry pairs the Lucide
// fallback (used on every non-Earned theme) with the hand-drawn
// Earned variant. Add new icons as additional entries — keep both
// renderers' API matching `className` so the swap is invisible to
// callers.

type IconName =
  | "palette"
  | "calendar-days"
  | "bell"
  | "shield"
  | "alert-triangle"
  | "infinity"
  | "play"
  | "settings"
  | "smartphone"
  | "monitor"
  | "trash"
  | "nudge";

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
  "alert-triangle": { lucide: AlertTriangle, earned: AlertTriangleEarned },
  infinity: { lucide: InfinityIcon, earned: InfinityEarned },
  play: { lucide: Play, earned: PlayEarned },
  settings: { lucide: Settings, earned: SettingsGearEarned },
  smartphone: { lucide: Smartphone, earned: SmartphoneEarned },
  monitor: { lucide: Monitor, earned: MonitorEarned },
  trash: { lucide: Trash2, earned: TrashEarned },
  // Nudge: Lucide uses HandHeart (a hand cradling a heart) for the
  // friend-nudge button; under Earned that becomes a paper airplane —
  // a folded note flying to the friend, more in line with the
  // notebook metaphor than a coloured glyph.
  nudge: { lucide: HandHeart, earned: PaperAirplaneEarned },
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
