// Hand-drawn smartphone for the Earned theme. 1.7px ink stroke,
// round caps/joins, slight rotation. Used for device-specific
// affordances (push subscription, install prompt).
// See design-system/project/README.md § Iconography.

export function SmartphoneEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(-1.5deg)" }}
    >
      {/* phone body — slightly wobbly rounded rectangle */}
      <path d="M7 2.7 C 6.1 2.7, 5.4 3.4, 5.4 4.3 L 5.4 19.7 C 5.4 20.6, 6.1 21.3, 7 21.3 L 17 21.3 C 17.9 21.3, 18.6 20.6, 18.6 19.7 L 18.6 4.3 C 18.6 3.4, 17.9 2.7, 17 2.7 Z" />
      {/* home button */}
      <path d="M10.4 18.2 L 13.6 18.2" />
    </svg>
  );
}
