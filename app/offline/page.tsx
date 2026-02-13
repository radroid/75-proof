"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
      }}
    >
      {/* Coral circle with "75" */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: "#FF6154",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          75
        </span>
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#1a1a1a",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        You&apos;re Offline
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "#1a1a1a",
          opacity: 0.6,
          margin: "0 0 32px",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        No internet connection right now, but don&apos;t break the chain.
        Get back online and keep going.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "12px 32px",
          backgroundColor: "#FF6154",
          color: "#ffffff",
          border: "none",
          borderRadius: 0,
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.01em",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
