import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-8 pt-12"
      style={{ backgroundColor: "#FFFBF0" }}
    >
      <Link
        href="/"
        className="mb-8 text-2xl font-black text-[#1a1a1a]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        75 Proof
      </Link>

      {children}

      <Link
        href="/"
        className="mt-8 text-[13px] font-bold text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60 transition-colors"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
