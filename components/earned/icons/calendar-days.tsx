// Hand-drawn calendar icon for the Earned theme. Wobbly rectangle
// with two tab marks at the top, and three rows of pen-dot day
// markers. See design-system/project/README.md § Iconography.

export function CalendarDaysEarned({ className }: { className?: string }) {
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
      {/* page outline */}
      <path d="M3.4 6 C 3.6 5.2, 4.2 4.6, 5 4.5 L 19 4.6 C 19.9 4.6, 20.5 5.2, 20.6 6.1 L 20.5 19.4 C 20.4 20.2, 19.8 20.5, 19 20.5 L 5 20.5 C 4.1 20.5, 3.5 19.9, 3.4 19 Z" />
      {/* top binding line */}
      <path d="M3.6 9.4 L 20.4 9.4" />
      {/* tab marks */}
      <path d="M8 3 L 8 6" />
      <path d="M16 3 L 16 6" />
      {/* day dots — 3 rows of 4 */}
      <circle cx="7" cy="13" r="0.7" fill="currentColor" />
      <circle cx="11" cy="13" r="0.7" fill="currentColor" />
      <circle cx="15" cy="13" r="0.7" fill="currentColor" />
      <circle cx="7" cy="16.4" r="0.7" fill="currentColor" />
      <circle cx="11" cy="16.4" r="0.7" fill="currentColor" />
      <circle cx="15" cy="16.4" r="0.7" fill="currentColor" />
    </svg>
  );
}
