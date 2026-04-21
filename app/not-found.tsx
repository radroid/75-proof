import Link from "next/link";

export default function NotFound() {
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
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
      }}
    >
      {/* Coral "75" badge */}
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
        aria-hidden="true"
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

      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "#1a1a1a",
          opacity: 0.5,
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        404
      </p>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#1a1a1a",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Page not found
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
        This page doesn&apos;t exist. Let&apos;s get you back to work.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: 320,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            padding: "12px 32px",
            backgroundColor: "#FF6154",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.01em",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Back to Dashboard
        </Link>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            padding: "12px 32px",
            backgroundColor: "transparent",
            color: "#1a1a1a",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.01em",
            border: "1px solid rgba(26,26,26,0.15)",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
