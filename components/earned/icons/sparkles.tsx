// Hand-drawn "Coach" tab glyph for the Earned theme. Three small
// pen-tap twinkles in different sizes — same metaphor as Lucide's
// Sparkles (which marks "magic / AI" surfaces) but rendered as
// quick crossing strokes on the page rather than a system glyph.
// Used by the desktop sidebar nav row labeled "Coach" in
// `app/(dashboard)/layout.tsx`. See
// design-system/project/README.md § Iconography.

export function SparklesEarned({ className }: { className?: string }) {
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
      style={{ transform: "rotate(-3deg)" }}
    >
      {/* big twinkle — center-left, ~8 unit span */}
      <path d="M8 8.6 L 8 17.4" />
      <path d="M3.8 13 L 12.2 13" />
      {/* medium twinkle — top-right, ~5 unit span */}
      <path d="M17.7 4 L 17.7 9" />
      <path d="M15.2 6.5 L 20.2 6.5" />
      {/* small twinkle — bottom-right, ~4 unit span */}
      <path d="M18.2 15.2 L 18.2 19.2" />
      <path d="M16.2 17.2 L 20.2 17.2" />
    </svg>
  );
}
