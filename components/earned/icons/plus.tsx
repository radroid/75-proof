// Hand-drawn plus for the Earned theme. Two short ink strokes
// crossed through the centre with a slight rotation so the glyph
// reads as drawn-by-hand rather than Lucide's clean geometric +.
// Used by the emoji picker's trigger button. See
// design-system/project/README.md § Iconography.

export function PlusEarned({ className }: { className?: string }) {
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
      {/* horizontal + vertical strokes — endpoints offset slightly
          off-grid (one pixel uneven on each axis) so the +
          actually reads as hand-drawn rather than collapsing to a
          mathematically perfect symmetric glyph at small sizes. */}
      <path d="M5.2 12 L 19 11.8" />
      <path d="M12 5.2 L 11.8 19" />
    </svg>
  );
}
