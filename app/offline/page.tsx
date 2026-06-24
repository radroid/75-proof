import { TryAgainButton } from "./try-again-button";

// Ensure this page is statically generated so the service worker can
// reliably precache it as the offline fallback.
export const dynamic = "force-static";
export const revalidate = false;

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
        backgroundColor: "var(--background)",
        fontFamily: "var(--font-body)",
        textAlign: "center",
      }}
    >
      {/* Gold star brand mark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/star.svg"
        alt=""
        width={84}
        height={84}
        style={{ marginBottom: 32 }}
        aria-hidden="true"
      />

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "var(--foreground)",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        You&apos;re offline
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "var(--foreground)",
          opacity: 0.6,
          margin: "0 0 32px",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        No internet connection right now, but don&apos;t break the streak.
        Get back online and keep showing up.
      </p>

      <TryAgainButton />
    </div>
  );
}
