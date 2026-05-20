// Hand-drawn trash can for the Earned theme. 1.7px ink stroke,
// round caps/joins, slight rotation. Used for destructive actions
// in Danger Zone. See design-system/project/README.md § Iconography.

export function TrashEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(-1.5deg)" }}
    >
      {/* lid */}
      <path d="M3.5 6.4 L 20.5 6.4" />
      {/* lid handle */}
      <path d="M9.5 3.4 L 14.5 3.4 C 14.9 3.4, 15.2 3.6, 15.2 4 L 15.2 6.4" />
      <path d="M8.8 4 L 8.8 6.4" />
      {/* can body — wobbly tapered shape */}
      <path d="M5.4 6.4 L 6.6 20.4 C 6.7 21.1, 7.2 21.5, 7.9 21.5 L 16.1 21.5 C 16.8 21.5, 17.3 21.1, 17.4 20.4 L 18.6 6.4" />
      {/* interior tick marks */}
      <path d="M10.5 10 L 10.7 17.5" />
      <path d="M13.5 10 L 13.3 17.5" />
    </svg>
  );
}
