// Hand-drawn brand star. Matches design-system/project/assets/star.svg.
// Colours come from the [data-theme="earned"] token block but fall back to
// the brand hex pair so the component renders correctly when mounted
// outside an Earned-themed surface (e.g. /offline, OG image previews).

export function Star({ size = 24, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
        fill={filled ? "var(--earned-star-gold, #D8A830)" : "none"}
        stroke="var(--earned-ink, #1F1F1D)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
