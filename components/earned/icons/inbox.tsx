// Hand-drawn inbox for the Earned theme. A notebook tray with a
// downward-arrow indicating "incoming". Used by requests-tab as the
// "Received" section glyph. 1.7px ink stroke, round caps/joins,
// slight rotation. See design-system/project/README.md § Iconography.

export function InboxEarned({ className }: { className?: string }) {
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
      {/* tray outline — wobbly rectangle with a notched dip on the
          top edge that reads as the "opening" where items land */}
      <path d="M3.4 4.4 C 3.6 3.8, 4.2 3.4, 5 3.4 L 19 3.4 C 19.8 3.4, 20.4 3.8, 20.6 4.4 L 20.4 14 C 20.4 14.7, 19.8 15.2, 19 15.2 L 16 15.2 L 14.4 17.4 L 9.6 17.4 L 8 15.2 L 5 15.2 C 4.2 15.2, 3.6 14.7, 3.6 14 Z" />
      {/* downward arrow inside — "incoming" */}
      <path d="M12 7 L 12 12.4" />
      <path d="M9.4 10 L 12 12.4 L 14.6 10" />
    </svg>
  );
}
