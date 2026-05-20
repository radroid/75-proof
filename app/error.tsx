"use client";

import { useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";

// Earned brand error boundary. Same visual + inline-token approach
// as /offline + /not-found — must render even when the theme
// provider hasn't mounted (hydration errors land here before any
// client context is up).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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
      {/* Gold star with a rose ink dot at the centre — "earned, but
          something interrupted it". Communicates "this isn't a fail
          state, just a hiccup" without leaning on a sad emoji. */}
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
        <circle cx="12" cy="13.2" r="1.7" fill="#C75F4A" />
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
        Something broke
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
        My progress is safe. Try again, or head back.
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
            backgroundColor: "#0090D8",
            color: "#F9F3E1",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.01em",
            border: "1.5px solid #1F1F1D",
            boxShadow: "2px 2px 0 #1F1F1D",
            cursor: "pointer",
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
            padding: "12px 32px",
            backgroundColor: "transparent",
            color: "#1F1F1D",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "0.01em",
            border: "1.5px dashed rgba(31,31,29,0.35)",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Back to today
        </Link>
      </div>

      {error.digest && (
        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "rgba(31,31,29,0.4)",
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
