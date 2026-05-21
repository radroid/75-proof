// Hand-drawn paper airplane for the Earned theme. 1.7px ink stroke,
// round joins, slight rotation. Used for the "nudge" affordance — a
// folded note flying to a friend. See
// design-system/project/README.md § Iconography.

export function PaperAirplaneEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(-8deg)" }}
    >
      {/* triangular outer shell — the folded plane silhouette */}
      <path d="M2.6 12 L 21.4 3.6 L 17.4 21.4 L 11.6 14 Z" />
      {/* inner fold crease — runs from the nose to the back fold */}
      <path d="M2.6 12 L 11.6 14" />
      <path d="M21.4 3.6 L 11.6 14" />
    </svg>
  );
}
