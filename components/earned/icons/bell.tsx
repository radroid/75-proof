// Hand-drawn bell icon for the Earned theme. 1.7px ink stroke,
// slight rotation. See design-system/project/README.md § Iconography.

export function BellEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(2deg)" }}
    >
      {/* bell body — wobbly upside-down U with widened rim */}
      <path d="M6 16.4 C 5.6 16.4, 5.2 16.7, 5.4 17.2 L 18.6 17.2 C 18.9 16.7, 18.4 16.4, 18 16.4 C 17.6 14.5, 17.7 12.3, 17.5 10.4 C 17.1 7, 14.6 4.7, 12 4.7 C 9.4 4.7, 6.9 7, 6.5 10.4 C 6.3 12.3, 6.4 14.5, 6 16.4 Z" />
      {/* clapper — small swing */}
      <path d="M10.4 19.6 C 11 20.4, 13 20.4, 13.6 19.6" />
      {/* button on top */}
      <path d="M12 3.4 L 12 4.7" />
    </svg>
  );
}
