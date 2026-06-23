"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { sharedUserProfileProps } from "@/lib/clerk-appearance";
import { useGuest } from "@/components/guest-provider";

function LandingPage() {
  const router = useRouter();
  const { enterLocalMode } = useGuest();

  return (
    <div
      className="min-h-dvh overflow-x-hidden selection:bg-[#FF6154]/20"
      style={{ backgroundColor: "#FFFBF0", color: "#1a1a1a" }}
    >
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        button { cursor: pointer; touch-action: manipulation; }
        button:focus-visible, a:focus-visible {
          outline: 2px solid #FF6154;
          outline-offset: 3px;
        }
      `}</style>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 py-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="earned" width={32} height={32} />
          <span
            className="text-xl font-black lowercase"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            earned
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Authenticated>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-[13px] font-bold px-4 sm:px-6 py-3 min-h-[44px] bg-[#4ECDC4] text-white rounded-none hover:bg-[#3dbdb5] active:scale-95 transition-all"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              DASHBOARD →
            </button>
            <UserButton
              userProfileProps={sharedUserProfileProps}
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-foreground/10",
                },
              }}
            />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <button
                className="hidden sm:inline-block text-[13px] font-bold px-5 py-3 min-h-[44px] border-2 border-[#1a1a1a]/15 text-[#1a1a1a] rounded-none hover:border-[#1a1a1a]/30 active:scale-95 transition-all"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                SIGN IN
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="text-[13px] font-bold px-4 sm:px-6 py-3 min-h-[44px] bg-[#FF6154] text-white rounded-none hover:bg-[#e5534b] active:scale-95 transition-all"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                JOIN FREE →
              </button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-6 md:px-10 pt-16 pb-24 sm:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-[56px] min-[375px]:text-6xl sm:text-8xl md:text-9xl font-black leading-[0.95] tracking-tight mb-6 lowercase"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            earned
          </h1>

          <p
            className="text-base sm:text-lg text-[#1a1a1a]/55 leading-relaxed max-w-md mx-auto mb-10"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            Show up. Every day. Build the streak.
          </p>

          <Unauthenticated>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <button
                  className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 min-h-[52px] bg-[#1a1a1a] text-white text-base sm:text-lg font-black hover:bg-[#FF6154] active:scale-[0.97] transition-all duration-300"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Get started →
                </button>
              </SignUpButton>
              <button
                onClick={enterLocalMode}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 min-h-[52px] border-2 border-[#1a1a1a]/15 text-[#1a1a1a] text-base sm:text-lg font-black hover:border-[#1a1a1a]/30 active:scale-[0.97] transition-all duration-300"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Track locally →
              </button>
            </div>
            <p
              className="text-xs text-[#1a1a1a]/40 mt-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Track locally: data stays on this device. No account, no cloud.
            </p>
          </Unauthenticated>
          <Authenticated>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 min-h-[52px] bg-[#1a1a1a] text-white text-base sm:text-lg font-black hover:bg-[#4ECDC4] active:scale-[0.97] transition-all duration-300"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Go to dashboard →
            </button>
          </Authenticated>
        </div>
      </section>

      <footer className="border-t border-[#1a1a1a]/8 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 sm:px-6 text-center">
        <span
          className="text-[13px] text-[#1a1a1a]/25 font-bold"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          earned © 2025
        </span>
      </footer>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#FFFBF0";
    document.body.style.backgroundColor = "#FFFBF0";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <>
      <AuthLoading>
        <div
          className="flex min-h-dvh items-center justify-center"
          style={{ backgroundColor: "#FFFBF0" }}
        >
          <div
            className="animate-pulse text-[#1a1a1a]/40"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Loading...
          </div>
        </div>
      </AuthLoading>

      <LandingPage />
    </>
  );
}
