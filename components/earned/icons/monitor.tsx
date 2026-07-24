// Hand-drawn desktop monitor for the Earned theme. 1.7px ink stroke,
// round caps/joins, slight rotation. Used for device pairing /
// install affordances on desktop. See
// design-system/project/README.md § Iconography.

export function MonitorEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(1deg)" }}
    >
      {/* screen */}
      <path d="M3.4 4.4 C 3.5 3.7, 4 3.3, 4.7 3.3 L 19.3 3.3 C 20 3.3, 20.5 3.7, 20.6 4.4 L 20.5 15.2 C 20.4 15.9, 19.9 16.3, 19.3 16.3 L 4.7 16.3 C 4.1 16.3, 3.6 15.9, 3.5 15.2 Z" />
      {/* stand neck */}
      <path d="M12 16.3 L 12 19.8" />
      {/* stand base */}
      <path d="M8.4 20.7 L 15.6 20.7" />
    </svg>
  );
}
