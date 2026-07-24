// Hand-drawn palette icon for the Earned theme. 1.7px ink stroke
// (within the 1.5–2px spec), round caps/joins, slight rotation to
// feel hand-placed. See design-system/project/README.md
// § Iconography for the rules.

export function PaletteEarned({ className }: { className?: string }) {
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
      {/* palette body — wobbly curve */}
      <path d="M12 3.4 C 6.5 3, 3.1 7.3, 3.3 12 C 3.6 17, 7.6 20.4, 11.5 20.4 C 13.2 20.4, 13.1 18.6, 14 17.5 C 14.9 16.4, 16 16.4, 17.4 16 C 19.4 15.4, 20.8 13.7, 20.6 11.2 C 20.3 7, 17 3.7, 12 3.4 Z" />
      {/* paint dabs */}
      <circle cx="8.5" cy="9" r="0.9" fill="currentColor" />
      <circle cx="13.5" cy="7" r="0.9" fill="currentColor" />
      <circle cx="16.8" cy="10.6" r="0.9" fill="currentColor" />
      <circle cx="7.4" cy="13.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
