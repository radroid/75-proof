import Link from "next/link";

// Earned brand 404 page. Inline visual choices — this page may
// render outside the theme provider (Next.js routes a 404 before
// client-side hydration), so we cannot depend on
// `[data-theme="earned"]` selectors. Matches the iter-001 /offline
// pattern: cream paper backdrop with faint ruled lines, gold star,
// Caveat handwritten headline, Poppins muted body.
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
      {/* Gold star, rotated 8° so the page reads as "slightly off" —
          a star that didn't quite land where it was supposed to. */}
      <svg
        width={96}
        height={96}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          display: "block",
          marginBottom: 24,
          transform: "rotate(-8deg)",
        }}
      >
        <path
          d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
          fill="#D8A830"
          stroke="#1F1F1D"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          color: "rgba(31,31,29,0.55)",
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        404
      </p>

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
        Page not found
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
        I can&apos;t find this page — let&apos;s get back.
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
            backgroundColor: "#0090D8",
            color: "#F9F3E1",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.01em",
            border: "1.5px solid #1F1F1D",
            boxShadow: "2px 2px 0 #1F1F1D",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Back to today
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
          Home
        </Link>
      </div>
    </div>
  );
}
