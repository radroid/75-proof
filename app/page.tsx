"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/ui/hero-section-with-smooth-bg-shader";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AuthLoading>

      <Authenticated>
        <HeroSection
          title="Welcome back to"
          highlightText="75 Proof"
          description="You're on your journey to mental toughness. Keep pushing, stay consistent, and crush your goals today."
          buttonText="Go to Dashboard"
          onButtonClick={() => router.push("/dashboard")}
          colors={["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#047857"]}
          distortion={0.6}
          swirl={0.4}
          speed={0.3}
          veilOpacity="bg-black/40"
        />
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10 ring-2 ring-white/20",
              },
            }}
          />
        </div>
      </Authenticated>

      <Unauthenticated>
        <HeroSection
          title="Transform Your Life with"
          highlightText="75 Proof"
          description="The ultimate 75 HARD challenge tracker. Two workouts, one gallon of water, clean eating, reading, and progress photos — all in one place. Build mental toughness. Stay accountable."
          buttonText="Start Your Journey"
          onButtonClick={() => router.push("/sign-up")}
          colors={["#059669", "#10b981", "#14b8a6", "#0d9488", "#047857", "#065f46"]}
          distortion={0.5}
          swirl={0.5}
          speed={0.25}
          veilOpacity="bg-black/20"
        />
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
          <SignInButton mode="modal">
            <Button variant="secondary" className="rounded-full">
              Sign In
            </Button>
          </SignInButton>
        </div>

        {/* Features section */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent pb-8 pt-16">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <span>💪</span>
              <span>2 Daily Workouts</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💧</span>
              <span>Water Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📚</span>
              <span>Reading Log</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📸</span>
              <span>Progress Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>Social Accountability</span>
            </div>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
