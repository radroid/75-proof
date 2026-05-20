// Hand-drawn flame for the Earned theme. Marks "milestone" entries
// in the activity feed. 1.7px ink stroke, round joins, gentle
// wobble. See design-system/project/README.md § Iconography.

export function FlameEarned({ className }: { className?: string }) {
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
      {/* outer flame silhouette — narrow tip, wider base */}
      <path d="M12 2.6 C 11 5.4, 9 6.6, 7.6 8.6 C 6 11, 5.6 14.4, 7.4 17 C 8.8 19.2, 10.6 20.4, 12 20.4 C 13.4 20.4, 15.2 19.2, 16.6 17 C 18.4 14.4, 18 11, 16.4 8.6 C 15 6.6, 13.4 5.4, 12.4 3.4 L 12 2.6 Z" />
      {/* inner accent — small inward curl */}
      <path d="M12 10.4 C 11.4 12.4, 10.4 13.6, 10.6 15.4 C 10.7 16.6, 11.4 17.4, 12 17.4 C 12.6 17.4, 13.3 16.6, 13.4 15.4 C 13.6 13.6, 12.6 12.4, 12 10.4 Z" />
    </svg>
  );
}
