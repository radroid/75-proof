// Hand-drawn rocket for the Earned theme. Marks "challenge_started"
// events in the activity feed. 1.7px ink stroke, round joins,
// slight rotation. See design-system/project/README.md § Iconography.

export function RocketEarned({ className }: { className?: string }) {
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
      {/* body — wobbly capsule */}
      <path d="M12 2.4 C 14 4, 15.4 7, 15.4 10.4 L 15.4 14.6 L 8.6 14.6 L 8.6 10.4 C 8.6 7, 10 4, 12 2.4 Z" />
      {/* left fin */}
      <path d="M8.6 11 L 5.4 14.6 L 5.6 17.4 L 8.6 14.6" />
      {/* right fin */}
      <path d="M15.4 11 L 18.6 14.6 L 18.4 17.4 L 15.4 14.6" />
      {/* porthole */}
      <circle cx="12" cy="9" r="1.5" fill="currentColor" />
      {/* flame trail — small triple-fork at the bottom */}
      <path d="M10 16 L 10.4 19" />
      <path d="M12 16 L 12 20" />
      <path d="M14 16 L 13.6 19" />
    </svg>
  );
}
