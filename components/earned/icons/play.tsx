// Hand-drawn play triangle for the Earned theme. 1.7px ink stroke,
// round joins, slight rotation. Used for tour / replay actions.
// See design-system/project/README.md § Iconography.

export function PlayEarned({ className }: { className?: string }) {
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
      {/* wobbly right-pointing triangle */}
      <path d="M7 4.4 C 7.4 4.2, 7.9 4.3, 8.4 4.6 L 19.6 11.2 C 20.4 11.7, 20.4 12.4, 19.6 12.9 L 8.4 19.5 C 7.6 20, 6.8 19.4, 6.8 18.6 L 6.8 5.5 C 6.8 5, 7 4.5, 7 4.4 Z" />
    </svg>
  );
}
