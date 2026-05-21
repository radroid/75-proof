// Hand-drawn "Progress" tab glyph for the Earned theme. Upward-
// trending zigzag with a small arrowhead at the top-right — same
// metaphor as Lucide's TrendingUp, but with off-grid endpoints and
// a slight rotation so the line reads as a quick pen sketch on the
// page rather than a system glyph. Used by the desktop sidebar nav
// row labeled "Progress" and the ProgressNavIcon wrapper (which
// adds the pending-friend-request count badge). See
// design-system/project/README.md § Iconography.

export function TrendingUpEarned({ className }: { className?: string }) {
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
      {/* zigzag — bottom-left, dip down, climb to mid, dip slightly,
          climb to top-right. endpoints nudged off-grid by a fraction
          of a unit so the line reads as drawn-by-hand. */}
      <path d="M3.5 16.6 L 9.2 11.2 L 12.8 14.5 L 20.4 7.3" />
      {/* arrowhead — two short strokes back into the line endpoint
          (the top + right edges of the triangle). */}
      <path d="M14.4 7.4 L 20.6 7.2 L 20.4 13.5" />
    </svg>
  );
}
