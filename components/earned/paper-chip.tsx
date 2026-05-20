// Sticker-shadow chip — the small inline pill used for streak / done
// counts. The 2px-offset boxShadow + heavy 1.5px ink border is the
// "stuck to the page" look from the design spec.

export type PaperChipTone = "cream" | "gold" | "sky";

export function PaperChip({
  tone = "cream",
  children,
}: {
  tone?: PaperChipTone;
  children: React.ReactNode;
}) {
  const palette: Record<PaperChipTone, { bg: string; fg: string }> = {
    cream: {
      bg: "var(--earned-cream-light, #F9F3E1)",
      fg: "var(--earned-ink, #1F1F1D)",
    },
    gold: {
      bg: "var(--earned-star-gold, #D8A830)",
      fg: "var(--earned-ink, #1F1F1D)",
    },
    sky: {
      bg: "var(--earned-sky, #0090D8)",
      fg: "var(--earned-cream-light, #F9F3E1)",
    },
  };
  const { bg, fg } = palette[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color: fg,
        border: "1.5px solid var(--earned-ink, #1F1F1D)",
        padding: "6px 14px",
        borderRadius: 999,
        fontFamily: "var(--font-poppins), system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 13,
        boxShadow: "2px 2px 0 var(--earned-ink, #1F1F1D)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
