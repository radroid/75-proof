import { TryAgainButton } from "./try-again-button";

// Ensure this page is statically generated so the service worker can
// reliably precache it as the offline fallback.
export const dynamic = "force-static";
export const revalidate = false;

// Earned brand offline page. We deliberately inline the visual choices
// instead of pulling theme tokens — this page is precached by the SW,
// must render without a working network or JS theme provider, and is
// not gated by personality (every user sees Earned here regardless of
// active theme). The hand-trembled star matches the dashboard's brand
// SVG so the page reads as part of the same product.
export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        // Cream paper background + faint repeating-rule lines so the
        // surface reads as a notebook page rather than a generic 404.
        backgroundColor: "#F4ECD8",
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(31,31,29,0.08) 31px, rgba(31,31,29,0.08) 32px)",
        backgroundPosition: "0 6px",
        fontFamily:
          "var(--font-poppins), system-ui, -apple-system, sans-serif",
        color: "#1F1F1D",
        textAlign: "center",
      }}
    >
      {/* Gold star — matches the dashboard celebration star at a
          larger size so the page has a single, confident focal point. */}
      <svg
        width={96}
        height={96}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: "block", marginBottom: 24 }}
      >
        <path
          d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
          fill="#D8A830"
          stroke="#1F1F1D"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>

      <h1
        style={{
          fontFamily:
            "var(--font-caveat), 'Caveat', 'Brush Script MT', cursive",
          fontSize: 56,
          fontWeight: 700,
          color: "#1F1F1D",
          margin: "0 0 8px",
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}
      >
        Offline
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "rgba(31,31,29,0.65)",
          margin: "0 0 32px",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        No connection right now — today&apos;s page will be here when you&apos;re back.
      </p>

      <TryAgainButton />
    </div>
  );
}
