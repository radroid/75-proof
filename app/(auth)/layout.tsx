import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-8 pt-12 bg-background">
      <Link
        href="/"
        className="mb-8 text-2xl font-black text-foreground"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        75 Proof
      </Link>

      {children}

      <Link
        href="/"
        className="mt-8 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontFamily: "var(--font-body)" }}
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
