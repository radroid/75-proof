// Hand-drawn "Today" / dashboard tab glyph for the Earned theme.
// Four small panels sketched in a 2x2 grid — like four quick pen
// rectangles on the page — to mirror Lucide's LayoutDashboard
// metaphor without the geometric crispness. Used inside the
// desktop sidebar nav row labeled "Today" in
// `app/(dashboard)/layout.tsx`. See design-system/project/README.md
// § Iconography.

export function LayoutDashboardEarned({ className }: { className?: string }) {
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
      {/* Four panels in a 2x2 grid. Corners are nudged off-grid by a
          fraction of a unit so the panels read as drawn-by-hand
          rather than as mathematically-perfect rectangles. */}
      <path d="M 3.8 3.8 L 10.4 3.7 L 10.5 10.5 L 3.8 10.4 Z" />
      <path d="M 13.7 3.7 L 20.4 3.8 L 20.4 10.4 L 13.6 10.5 Z" />
      <path d="M 3.8 13.6 L 10.4 13.5 L 10.5 20.3 L 3.8 20.5 Z" />
      <path d="M 13.6 13.5 L 20.4 13.7 L 20.4 20.4 L 13.7 20.3 Z" />
    </svg>
  );
}
