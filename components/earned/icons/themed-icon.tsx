"use client";

import * as React from "react";
import {
  Palette,
  CalendarDays,
  CalendarClock,
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
  Rocket,
  Trophy,
  Flame,
  RotateCcw,
  Plus,
  X,
  Inbox,
  Send,
  History,
  MessageSquareText,
  LayoutDashboard,
  Check,
  XCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useThemePersonality } from "@/components/theme-provider";
import { PaletteEarned } from "./palette";
import { CalendarDaysEarned } from "./calendar-days";
import { CalendarClockEarned } from "./calendar-clock";
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
import { RocketEarned } from "./rocket";
import { TrophyEarned } from "./trophy";
import { FlameEarned } from "./flame";
import { RotateCwEarned } from "./rotate-cw";
import { PlusEarned } from "./plus";
import { InboxEarned } from "./inbox";
import { CrossMarkEarned } from "./cross-mark";
import { HistoryEarned } from "./history";
import { NoteEarned } from "./note";
import { LayoutDashboardEarned } from "./layout-dashboard";
import { CheckEarned } from "./check";
import { XCircleEarned } from "./x-circle";
import { TrendingUpEarned } from "./trending-up";

// Named lookup of icon variants. Each entry pairs the Lucide
// fallback (used on every non-Earned theme) with the hand-drawn
// Earned variant. Add new icons as additional entries — keep both
// renderers' API matching `className` so the swap is invisible to
// callers.
//
// a11y: lucide-react v0.562+ auto-applies `aria-hidden="true"` to any
// icon rendered without children + without an a11y prop (`aria-label`,
// `role`, etc.), per `node_modules/lucide-react/dist/esm/Icon.js`
// line 32. So swap sites migrating from a bare Lucide icon to
// `ThemedIcon` can safely drop their JSX-level `aria-hidden`. The
// Earned variants declare `aria-hidden` directly on their SVG, so
// either branch is correctly hidden from assistive tech.

type IconName =
  | "palette"
  | "calendar-days"
  | "calendar-clock"
  | "bell"
  | "shield"
  | "alert-triangle"
  | "infinity"
  | "play"
  | "settings"
  | "smartphone"
  | "monitor"
  | "trash"
  | "nudge"
  | "rocket"
  | "trophy"
  | "flame"
  | "rotate-cw"
  | "plus"
  | "close"
  | "inbox"
  | "send"
  | "history"
  | "note"
  | "layout-dashboard"
  | "check"
  | "x-circle"
  | "trending-up";

const variants: Record<
  IconName,
  {
    lucide: LucideIcon;
    earned: React.ComponentType<{ className?: string }>;
  }
> = {
  palette: { lucide: Palette, earned: PaletteEarned },
  "calendar-days": { lucide: CalendarDays, earned: CalendarDaysEarned },
  // Pre-start countdown surface (ChallengeUpcoming) — a calendar
  // page with a small clock face nesting into the bottom-right
  // corner to signal "scheduled for a future moment". Lucide's
  // CalendarClock is the same metaphor; the Earned variant keeps
  // it inside the notebook vocabulary (wobbly page outline + ring
  // clock with hands at 12 and 3).
  "calendar-clock": { lucide: CalendarClock, earned: CalendarClockEarned },
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
  // Activity feed glyphs — marking challenge_started / completed /
  // failed / milestone entries. Lucide's glyphs (Rocket, Trophy,
  // RotateCcw, Flame) are colour-emoji-shaped on most platforms; the
  // hand-drawn variants keep the timeline reading as a notebook.
  rocket: { lucide: Rocket, earned: RocketEarned },
  trophy: { lucide: Trophy, earned: TrophyEarned },
  flame: { lucide: Flame, earned: FlameEarned },
  "rotate-cw": { lucide: RotateCcw, earned: RotateCwEarned },
  // UI chrome glyphs for picker triggers + close buttons + inbox /
  // send empty-state markers. `close` reuses CrossMarkEarned (same
  // hand-drawn × used for missed-day cells on /progress); `send`
  // reuses PaperAirplaneEarned (same folded plane used for the
  // friend-nudge button) since "outgoing requests" and "send a
  // nudge" both read as "this note is going somewhere".
  plus: { lucide: Plus, earned: PlusEarned },
  close: { lucide: X, earned: CrossMarkEarned },
  inbox: { lucide: Inbox, earned: InboxEarned },
  send: { lucide: Send, earned: PaperAirplaneEarned },
  // Coach "recent chats" trigger — Lucide's History glyph is a clock
  // with a counter-clockwise arrow; the hand-drawn variant keeps the
  // same metaphor (rewind / previous pages) on cream paper.
  history: { lucide: History, earned: HistoryEarned },
  // Individual chat-thread row glyph. Lucide's MessageSquareText is a
  // rounded speech-bubble with text lines; Earned threads read as
  // torn pages from the notebook, so the hand-drawn variant is a
  // sheet of paper with a folded corner and three written lines.
  note: { lucide: MessageSquareText, earned: NoteEarned },
  // Desktop sidebar nav "Today" tab glyph (app/(dashboard)/layout.tsx).
  // Lucide's LayoutDashboard is four rounded panels in a 2x2 grid;
  // the Earned variant is four hand-drawn quadrangles sketched on
  // the page so the nav row reads as a notebook tab marker rather
  // than a system icon.
  "layout-dashboard": { lucide: LayoutDashboard, earned: LayoutDashboardEarned },
  // Selected-state tick inside the theme switcher's gold disc. The
  // Earned variant is a single hand-drawn check stroke with a slight
  // rotation, so the confirmation reads as drawn-by-hand rather than
  // Lucide's geometric ✓.
  check: { lucide: Check, earned: CheckEarned },
  // Failed-challenge status badge (challenge-picker dropdown row in
  // /dashboard/progress). Lucide's XCircle is a filled ring with an
  // X; the Earned variant is a wobbly open ring wrapping the same
  // crossing strokes used by CrossMarkEarned, so the failed glyph
  // reads as a more emphatic version of the missed-day mark on the
  // calendar grid.
  "x-circle": { lucide: XCircle, earned: XCircleEarned },
  // Desktop sidebar "Progress" tab glyph + ProgressNavIcon wrapper (the
  // pending-friend-request badge). Lucide's TrendingUp is an upward
  // zigzag with an arrowhead; the Earned variant is the same shape
  // sketched by hand, so the nav row reads as a pen mark on the page.
  "trending-up": { lucide: TrendingUp, earned: TrendingUpEarned },
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
