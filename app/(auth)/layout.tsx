import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background px-4"
      style={{
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <Link
        href="/"
        aria-label="75 Proof — back to home"
        className="mb-6 inline-flex min-h-[44px] items-center justify-center rounded-md px-3 py-2 text-2xl font-black text-foreground touch-manipulation transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        75 Proof
      </Link>

      {children}

      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-3 text-[13px] font-bold text-muted-foreground touch-manipulation transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ fontFamily: "var(--font-body)" }}
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
