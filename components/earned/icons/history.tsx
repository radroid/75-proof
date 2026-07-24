// Hand-drawn "history" glyph for the Earned theme. Clock face with a
// counter-clockwise arrow swinging back to noon — reads as both
// "clock" and "rewind to a previous state", the same metaphor
// Lucide's History uses. 1.7px ink stroke, slight rotation, round
// caps + joins. See design-system/project/README.md § Iconography.

export function HistoryEarned({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ transform: "rotate(-2deg)" }}
    >
      {/* Clock face — drawn as a near-closed loop rather than a true
          circle so the rendering keeps a faint hand-trembled feel.
          Path leaves a small gap at the top-left so the "rewind"
          arrow can sweep into it without crossing. */}
      <path d="M5.4 6.6 C 7.5 4.1, 11 3, 13.6 3.4 C 18 4.2, 21 8, 20.6 12.6 C 20.2 17, 16.4 20.4, 11.8 20.4 C 7.4 20.4, 3.6 16.8, 3.4 12.2" />
      {/* Counter-clockwise arrow head pointing left-and-up into the gap
          at the 10-11 o'clock position. Reads as "go back / replay". */}
      <path d="M6.6 8.4 L 3.6 7 L 4.6 4" />
      {/* Hour + minute hand — hour points to ~10, minute points to ~12
          (slightly off-grid so it doesn't look ruler-perfect). Both
          terminate at a shared centre dot at (12, 12). */}
      <path d="M12 12 L 9.6 8.8" />
      <path d="M12 12 L 12.2 7.2" />
    </svg>
  );
}
