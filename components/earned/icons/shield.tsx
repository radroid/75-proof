// Hand-drawn shield icon for the Earned theme. 1.7px ink stroke,
// wobbly heraldic shape. See design-system/project/README.md
// § Iconography.

export function ShieldEarned({ className }: { className?: string }) {
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
      {/* shield outline — wider at the top, tapered to a point */}
      <path d="M12 3.5 C 9 4.4, 5.5 4.5, 4.2 4.5 C 4.1 9, 4.3 13.3, 6 16.5 C 7.7 19.6, 10 20.5, 12 20.6 C 14 20.5, 16.3 19.6, 18 16.5 C 19.7 13.3, 19.9 9, 19.8 4.5 C 18.5 4.5, 15 4.4, 12 3.5 Z" />
      {/* interior checkmark — keeps the icon set visually cohesive
          with the other Earned glyphs (palette dabs, calendar dots,
          bell clapper) that all have a small interior mark. */}
      <path d="M8.5 11.8 L 11 14.4 L 15.6 9.8" />
    </svg>
  );
}
