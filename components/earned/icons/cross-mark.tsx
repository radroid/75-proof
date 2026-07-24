// Hand-drawn missed-day mark for the Earned theme. Two short ink
// strokes crossed through the cell centre — the design-system
// alternative to Lucide's geometric X. See
// design-system/project/README.md § Iconography.

export function CrossMarkEarned({ className }: { className?: string }) {
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
      {/* two short hand-drawn lines crossing through centre */}
      <path d="M8.4 8.6 L 15.8 15.6" />
      <path d="M15.6 8.4 L 8.6 15.8" />
    </svg>
  );
}
