import { ImageResponse } from "next/og";

export const alt = "earned";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Earned brand OG. Cream paper, gold star, hand-written feel via a
// loose-cursive system fallback. The runtime here is the Edge OG image
// generator — no access to next/font, so we lean on inline SVG +
// system font stacks. Caveat-like cursive is requested first; iOS
// renders "Snell Roundhand", desktop falls back to italic serif.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4ECD8",
          fontFamily: "'Brush Script MT', 'Snell Roundhand', cursive",
          position: "relative",
        }}
      >
        {/* Gold top strip — matches the Earned star colour. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: "#D8A830",
          }}
        />

        {/* Faint ruled-paper guide lines, repeating every 56px from the
            top. Drawn as separate divs so the OG renderer doesn't have
            to handle CSS backgrounds. */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 60 + i * 56,
              height: 1,
              backgroundColor: "rgba(31,31,29,0.08)",
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            position: "relative",
          }}
        >
          {/* Gold star — inline SVG. */}
          <svg width={120} height={120} viewBox="0 0 24 24">
            <path
              d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
              fill="#D8A830"
              stroke="#1F1F1D"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </svg>

          <div
            style={{
              fontSize: 160,
              fontWeight: 700,
              color: "#1F1F1D",
              lineHeight: 1,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
          >
            earned
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: "rgba(31,31,29,0.7)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            Show up. Every day. Earn the star.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
