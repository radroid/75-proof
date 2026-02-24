"use client";

import { Dumbbell } from "lucide-react";
import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center px-4 sm:px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base">75 Proof</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 pb-safe pt-4">
        <div className="w-full max-w-2xl pb-8">{children}</div>
      </main>
    </div>
  );
}
