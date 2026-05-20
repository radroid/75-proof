// Hand-drawn trophy for the Earned theme. Marks "challenge_completed"
// activity-feed events. 1.7px ink stroke, slight rotation.
// See design-system/project/README.md § Iconography.

export function TrophyEarned({ className }: { className?: string }) {
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
      {/* cup — wobbly U-shape with shoulders */}
      <path d="M7.4 3.4 L 16.6 3.4 L 16.4 9.4 C 16.4 12.4, 14.4 14.4, 12 14.4 C 9.6 14.4, 7.6 12.4, 7.6 9.4 Z" />
      {/* left handle */}
      <path d="M7.4 5 C 4.5 5.2, 3.6 6.6, 4 8.4 C 4.3 9.6, 5.5 10.4, 7 10.6" />
      {/* right handle */}
      <path d="M16.6 5 C 19.5 5.2, 20.4 6.6, 20 8.4 C 19.7 9.6, 18.5 10.4, 17 10.6" />
      {/* stem */}
      <path d="M12 14.4 L 12 17.4" />
      {/* base */}
      <path d="M8.5 20.6 L 15.5 20.6" />
      <path d="M9.6 17.4 L 14.4 17.4 L 14.4 20.6 L 9.6 20.6 Z" />
    </svg>
  );
}
