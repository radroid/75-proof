// Hand-drawn checkmark for the Earned theme. A single ink stroke
// that dips down-and-right then sweeps up-and-right, with off-grid
// endpoints + slight rotation so the glyph reads as drawn-by-hand
// rather than Lucide's geometric Check. Used inside the theme
// switcher's selected-state badge (gold disc) and anywhere a small
// confirmation tick is needed. See design-system/project/README.md
// § Iconography.

export function CheckEarned({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ transform: "rotate(-2deg)" }}
    >
      {/* single hand-drawn check — short down-stroke, longer up-stroke,
          endpoints nudged off-grid so the glyph doesn't collapse to a
          mathematically perfect tick at small sizes. */}
      <path d="M5.4 12.2 L 9.8 17 L 18.6 7.4" />
    </svg>
  );
}
