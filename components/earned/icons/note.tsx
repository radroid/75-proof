// Hand-drawn "note" glyph for the Earned theme. Sheet of paper with
// three horizontal lines + a folded triangular corner. Replaces
// Lucide's MessageSquareText (a rounded speech-bubble with text
// lines) on Earned-themed surfaces where individual chat threads
// read as torn pages from the notebook. 1.7px ink stroke, slight
// rotation, round caps + joins. See design-system/project/README.md
// § Iconography.

export function NoteEarned({ className }: { className?: string }) {
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
      {/* Paper edge — left + bottom + right (the top folds), drawn as
          slightly off-orthogonal segments so it reads hand-drawn rather
          than ruler-perfect. The top-right corner is cut to make room
          for the fold. */}
      <path d="M4.4 4.6 L 4.6 20 L 19.6 19.6 L 19.4 9.6" />
      {/* Folded corner — diagonal fold-line + the two short edges that
          show the underside of the fold. The fold goes from (19.4, 9.6)
          to (14, 4.4) and then the top edge runs back to (4.4, 4.6). */}
      <path d="M14 4.4 L 4.4 4.6" />
      <path d="M14 4.4 L 14.2 9.4 L 19.4 9.6" />
      {/* Text lines — three slightly-trembled horizontal strokes,
          stopping short of the right edge so the fold reads as
          covering them. */}
      <path d="M7.4 11.2 L 16 11.2" />
      <path d="M7.4 13.8 L 16 13.8" />
      <path d="M7.4 16.4 L 13 16.4" />
    </svg>
  );
}
