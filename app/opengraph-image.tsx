import { ImageResponse } from "next/og";

export const alt = "earned";
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#1a1a1a",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            earned
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "#FF6154",
              letterSpacing: "0.02em",
            }}
          >
            Show up. Every day.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
