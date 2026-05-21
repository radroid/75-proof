// Hand-drawn looping arrow for the Earned theme. Marks
// "challenge_failed" entries — a restart, not a punishment.
// 1.7px ink stroke, slight rotation. See
// design-system/project/README.md § Iconography.

export function RotateCwEarned({ className }: { className?: string }) {
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
      {/* Almost-full clockwise loop — swings around and returns to the
          top-right so the chevron sits at the arc's visible terminus
          (20, 7.6) rather than disconnected at the opposite quadrant. */}
      <path d="M19.4 7.6 C 17.6 4.6, 14.4 3, 11 3.6 C 6.4 4.4, 3 8.6, 3.6 13.4 C 4.4 18.2, 9 21.2, 13.6 20.4 C 16.6 19.9, 19 17.6, 19.8 14.6 C 20.6 12.2, 20.4 9.5, 20 7.6" />
      {/* arrow head — chevron with its middle vertex at the arc's
          terminus, so it reads as a continuation of the loop. */}
      <path d="M16 8 L 20 7.6 L 19.4 3.6" />
    </svg>
  );
}
