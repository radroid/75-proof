// Notebook-style key/value row. Matches the MeScreen pattern from
// design-system/project/ui_kits/earned-ios/screens.jsx (L226-240):
// label in Poppins (muted ink), value in Caveat (ink), dashed
// cream-dark bottom border, justify-between flex.
//
// Use inside an Earned surface — the inline styles assume the
// brand palette tokens are present. Outside Earned, the row will
// render with sane fallbacks but won't read as "notebook" without
// the handwritten font wired up.

export function EarnedRow({
  label,
  value,
  action,
}: {
  label: string;
  /** Right-side value. Strings get the Caveat handwritten treatment;
      pass a node directly to render any interactive control. */
  value?: React.ReactNode;
  /** Optional trailing action (e.g. a Button or icon). Renders inside
      the value column's inline-flex — best suited for icons / short
      strings. A full-sized Button will push the value text leftward
      and may break the row layout; lift such controls out to their
      own surface instead of stuffing them here. */
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px dashed var(--earned-cream-dark, #E8DEC4)",
        minHeight: 44,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-poppins), system-ui, sans-serif",
          fontSize: 13,
          color: "rgba(31,31,29,0.6)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          textAlign: "right",
          fontFamily: "var(--font-caveat), 'Caveat', cursive",
          fontWeight: 600,
          fontSize: 20,
          color: "var(--earned-ink, #1F1F1D)",
          lineHeight: 1.1,
        }}
      >
        {value}
        {action}
      </span>
    </div>
  );
}
