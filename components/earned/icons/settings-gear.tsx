// Hand-drawn settings gear for the Earned theme. 1.7px ink stroke,
// round caps/joins, slight rotation. See
// design-system/project/README.md § Iconography.
//
// Named `SettingsGear` rather than `Settings` to avoid name-clashing
// with React's `Settings` route component when both are imported.

export function SettingsGearEarned({ className }: { className?: string }) {
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
      {/* outer wobbly gear silhouette — 8 teeth */}
      <path d="M12 2.7 L 13.2 4.2 L 15.4 3.5 L 16.1 5.6 L 18.5 5.5 L 18.4 7.9 L 20.5 8.6 L 19.8 10.8 L 21.3 12 L 19.8 13.2 L 20.5 15.4 L 18.4 16.1 L 18.5 18.5 L 16.1 18.4 L 15.4 20.5 L 13.2 19.8 L 12 21.3 L 10.8 19.8 L 8.6 20.5 L 7.9 18.4 L 5.5 18.5 L 5.6 16.1 L 3.5 15.4 L 4.2 13.2 L 2.7 12 L 4.2 10.8 L 3.5 8.6 L 5.6 7.9 L 5.5 5.5 L 7.9 5.6 L 8.6 3.5 L 10.8 4.2 Z" />
      {/* center hole */}
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}
