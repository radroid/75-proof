import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "75 Proof - Do Hard Stuff. Feel Amazing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          backgroundColor: "#FFFBF0",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: "#FF6154",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Logo / Title */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#1a1a1a",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            75 Proof
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "#FF6154",
              letterSpacing: "0.02em",
            }}
          >
            Do Hard Stuff. Feel Amazing.
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 22,
              color: "#1a1a1a",
              opacity: 0.6,
              maxWidth: 700,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Track your 75 HARD challenge — workouts, water, reading, and
            progress photos
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            color: "#1a1a1a",
            opacity: 0.4,
          }}
        >
          75.createplus.club
        </div>
      </div>
    ),
    { ...size }
  );
}
