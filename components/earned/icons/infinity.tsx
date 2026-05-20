// Hand-drawn infinity loop for the Earned theme. Used to mark
// habit-tracker mode (no end date). 1.7px ink stroke, round joins,
// slight rotation. See design-system/project/README.md § Iconography.

export function InfinityEarned({ className }: { className?: string }) {
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
      {/* lemniscate — left lobe to right lobe through the center */}
      <path d="M6.4 8.6 C 4 8.7, 2.7 10.6, 2.8 12 C 2.9 13.5, 4.1 15.4, 6.4 15.4 C 8.6 15.4, 9.8 13.4, 12 12 C 14.2 10.6, 15.4 8.6, 17.6 8.6 C 19.9 8.6, 21.1 10.5, 21.2 12 C 21.3 13.4, 20 15.3, 17.6 15.4 C 15.4 15.4, 14.2 13.4, 12 12 C 9.8 10.6, 8.6 8.7, 6.4 8.6 Z" />
    </svg>
  );
}
