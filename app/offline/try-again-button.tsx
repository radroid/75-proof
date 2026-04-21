"use client";

export function TryAgainButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        minHeight: 48,
        minWidth: 44,
        padding: "12px 32px",
        backgroundColor: "#FF6154",
        color: "#ffffff",
        border: "none",
        borderRadius: 0,
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
  );
}
