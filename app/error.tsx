"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console; telemetry hook-point for future
    console.error("App error boundary:", error);
  }, [error]);

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

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#1a1a1a",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Something went wrong
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
        Unexpected error. Your progress is safe &mdash; try again or head back
        to the dashboard.
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
        <button
          onClick={reset}
          style={{
            minHeight: 48,
            padding: "12px 32px",
            backgroundColor: "#FF6154",
            color: "#ffffff",
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.01em",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
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
          Back to Dashboard
        </Link>
      </div>

      {error.digest && (
        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "#1a1a1a",
            opacity: 0.3,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            letterSpacing: "0.05em",
          }}
        >
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
