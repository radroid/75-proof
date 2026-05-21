// Hand-drawn calendar-with-clock-overlay icon for the Earned theme.
// Mirrors Lucide's CalendarClock metaphor (a calendar page with a
// small clock face nesting into the bottom-right corner) but in the
// drawn-by-hand vocabulary used by CalendarDaysEarned: wobbly page
// outline, top binding line, tab marks. The clock is a small ring
// with an hour hand pointing to 12 + a minute hand to 3. Used by
// `components/challenge-upcoming.tsx` to mark the pre-start
// countdown surface. See design-system/project/README.md
// § Iconography.

export function CalendarClockEarned({ className }: { className?: string }) {
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
      {/* page outline — full top + left + bottom, with the right side
          truncated so the clock can nest into the bottom-right
          corner without colliding with the page line. */}
      <path d="M3.4 6.4 C 3.5 5.7, 4 5.3, 4.7 5.3 L 16.4 5.3 C 17.1 5.3, 17.5 5.7, 17.6 6.4 L 17.5 11.4" />
      <path d="M3.4 11.4 L 3.4 17.4 C 3.4 18.1, 3.9 18.5, 4.6 18.5 L 11.6 18.5" />
      {/* top binding line */}
      <path d="M3.6 9 L 17.4 9" />
      {/* tab marks */}
      <path d="M7 3.6 L 7 5.4" />
      <path d="M14 3.6 L 14 5.4" />
      {/* clock in bottom-right — circle + hour hand (to 12) + minute
          hand (to 3) drawn as a single path so the join at the
          centre reads as a hand-drawn corner rather than two
          mathematically-perfect segments. */}
      <circle cx="16.8" cy="16.8" r="4.4" />
      <path d="M16.8 14.2 L 16.8 16.8 L 19.3 16.8" />
    </svg>
  );
}
