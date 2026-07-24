// Hand-drawn "failed status" mark for the Earned theme. A wobbly
// open circle wrapping the same two short crossing strokes used by
// `CrossMarkEarned` — so the failed-challenge glyph reads as a more
// emphatic version of the missed-day mark on the progress calendar.
// Used by the challenge-picker dropdown in `/dashboard/progress` to
// label challenges with status === "failed". See
// design-system/project/README.md § Iconography.

export function XCircleEarned({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ transform: "rotate(-2deg)" }}
    >
      {/* ring — strokeWidth nudged down so the inner X reads as the
          primary signal rather than competing with the ring weight. */}
      <circle cx="12" cy="12" r="9.2" strokeWidth={1.6} />
      {/* X strokes — same vocabulary as CrossMarkEarned, scaled in
          slightly so they fit inside the ring with a comfortable
          margin. */}
      <path d="M9 9.2 L 15 14.8" />
      <path d="M14.8 9 L 9.2 14.8" />
    </svg>
  );
}
