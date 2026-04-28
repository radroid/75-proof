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

      {/* Content — width and padding are owned by each step so the AI coach
          can go full-bleed while the standard form steps stay capped at
          `max-w-2xl` with a comfortable inset. */}
      <main className="flex-1 flex flex-col items-stretch min-h-0">
        {children}
      </main>
    </div>
  );
}
