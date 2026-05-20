// Hand-drawn alert triangle for the Earned theme. 1.7px ink stroke,
// round caps/joins, slight rotation. Used for danger / warning
// states. See design-system/project/README.md § Iconography.

export function AlertTriangleEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(-1deg)" }}
    >
      {/* wobbly triangle */}
      <path d="M12 3.4 C 12.6 3.5, 13 4, 13.4 4.6 L 21 18.6 C 21.4 19.4, 20.9 20.4, 20 20.5 L 4 20.5 C 3.1 20.4, 2.6 19.4, 3 18.6 L 10.6 4.6 C 11 4, 11.4 3.5, 12 3.4 Z" />
      {/* exclamation stem */}
      <path d="M12 9.4 L 12 14.2" />
      {/* exclamation dot */}
      <circle cx="12" cy="17" r="0.85" fill="currentColor" />
    </svg>
  );
}
