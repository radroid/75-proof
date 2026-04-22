"use client";

type Tier = {
  min: number;
  glyph: string;
  label: string;
  className: string;
};

const TIERS: Tier[] = [
  {
    min: 30,
    glyph: "💎",
    label: "diamond",
    className: "bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/30",
  },
  {
    min: 14,
    glyph: "🔥",
    label: "fire",
    className:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30",
  },
  {
    min: 7,
    glyph: "⭐",
    label: "gold",
    className:
      "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30",
  },
  {
    min: 2,
    glyph: "🤝",
    label: "starter",
    className: "bg-primary/10 text-primary",
  },
];

function tierFor(days: number): Tier {
  return TIERS.find((t) => days >= t.min) ?? TIERS[TIERS.length - 1];
}

export function CoStreakChip({
  days,
  friendName,
}: {
  days: number;
  friendName: string;
}) {
  const tier = tierFor(days);
  return (
    <div
      className={[
        "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tier.className,
      ].join(" ")}
      aria-label={`${days}-day co-streak with ${friendName}`}
      title={`You and ${friendName} have both completed ${days} day${
        days === 1 ? "" : "s"
      } in a row`}
    >
      <span aria-hidden="true">{tier.glyph}</span>
      <span className="tabular-nums">{days}</span>
      <span>-day co-streak</span>
    </div>
  );
}
