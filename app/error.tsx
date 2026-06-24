"use client";

import { useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";

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
    posthog.captureException(error, { digest: error.digest });
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
        style={{ marginBottom: 28 }}
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
        Something went wrong
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "var(--foreground)",
          opacity: 0.72,
          margin: "0 0 32px",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Unexpected error. Your progress is safe &mdash; try again or head back
        to your dashboard.
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
            borderRadius: 10,
            padding: "12px 32px",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.01em",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            borderRadius: 10,
            padding: "12px 32px",
            backgroundColor: "transparent",
            color: "var(--foreground)",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.01em",
            border: "1px solid var(--border)",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Back to my dashboard
        </Link>
      </div>

      {error.digest && (
        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "var(--foreground)",
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
