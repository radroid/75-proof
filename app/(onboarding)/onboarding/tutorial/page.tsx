"use client";

import { Suspense, useEffect, useCallback, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Player, type PlayerRef } from "@remotion/player";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TutorialVideo } from "@/remotion/compositions/Tutorial/TutorialVideo";
import { TOTAL_FRAMES, FPS, COMP_WIDTH, COMP_HEIGHT } from "@/remotion/compositions/Tutorial/lib/constants";
import type { ThemeName } from "@/remotion/compositions/Tutorial/lib/theme-styles";
import { defaultTutorialProps } from "@/remotion/compositions/Tutorial/lib/mock-data";
import { useThemePersonality } from "@/components/theme-provider";
import { X } from "lucide-react";

const STORAGE_KEY = "75hard-onboarding-state";
const SPEEDS = [1, 1.5, 2, 3] as const;

export default function TutorialPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background min-h-[100dvh] flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
        </div>
      }
    >
      <TutorialPageInner />
    </Suspense>
  );
}

function TutorialPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSettings = searchParams.get("from") === "settings";
  const { personality } = useThemePersonality();
  const user = useQuery(api.users.getCurrentUser);
  const markSeen = useMutation(api.users.markTutorialSeen);
  const playerRef = useRef<PlayerRef>(null);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  // Read onboarding state from sessionStorage to get theme + habits
  const [props, setProps] = useState(defaultTutorialProps);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        setProps({
          theme: (state.theme as ThemeName) || "arctic",
          habits:
            state.habits?.filter((h: { isActive?: boolean }) => h.isActive !== false) ??
            defaultTutorialProps.habits,
          displayName: state.displayName || user?.displayName || "Challenger",
        });
      } else if (user) {
        // No onboarding sessionStorage — use current theme (e.g. replay from settings)
        setProps((p) => ({
          ...p,
          theme: personality as ThemeName,
          displayName: user.displayName || "Challenger",
        }));
      }
    } catch {
      // ignore parse errors
    }
  }, [user, personality]);

  // Guard: if user already saw the tutorial, go to dashboard (skip when replaying from settings)
  useEffect(() => {
    if (!fromSettings && user?.hasSeenTutorial) {
      router.replace("/dashboard");
    }
  }, [fromSettings, user?.hasSeenTutorial, router]);

  const goToDashboard = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await markSeen();
    } catch {
      // proceed even if mutation fails
    }
    sessionStorage.removeItem(STORAGE_KEY);
    router.push(fromSettings ? "/dashboard/settings" : "/dashboard");
  }, [leaving, markSeen, router, fromSettings]);

  // Listen for video end and track progress
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onEnded = () => {
      goToDashboard();
    };

    const onTimeUpdate: Parameters<typeof player.addEventListener<"timeupdate">>[1] = (e) => {
      setProgress(e.detail.frame / TOTAL_FRAMES);
    };

    player.addEventListener("ended", onEnded);
    player.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [goToDashboard]);

  if (user === undefined) {
    return (
      <div className="bg-background min-h-[100dvh] flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (user === null) {
    router.replace("/sign-in");
    return null;
  }

  return (
    <div className="relative bg-background min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      {fromSettings && (
        <button
          onClick={goToDashboard}
          disabled={leaving}
          aria-label="Close tutorial"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground transition-opacity hover:opacity-80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 z-10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Video container — cap by both width and height so it never overflows on short viewports */}
      <div
        className="w-full"
        style={{ maxWidth: `min(100%, calc((100dvh - 10rem) * ${COMP_WIDTH / COMP_HEIGHT}))` }}
      >
        <div className="relative">
          <Player
            ref={playerRef}
            component={TutorialVideo}
            inputProps={props}
            durationInFrames={TOTAL_FRAMES}
            compositionWidth={COMP_WIDTH}
            compositionHeight={COMP_HEIGHT}
            fps={FPS}
            autoPlay
            playbackRate={SPEEDS[speedIndex]}
            style={{
              width: "100%",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          />

          <button
            onClick={() => setSpeedIndex((i) => (i + 1) % SPEEDS.length)}
            aria-label={`Playback speed: ${SPEEDS[speedIndex]}x. Tap to change.`}
            className="absolute bottom-3 right-3 inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg bg-black/55 px-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 active:bg-black/80"
          >
            {SPEEDS[speedIndex]}x
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Tutorial progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {!fromSettings && (
        <button
          onClick={goToDashboard}
          disabled={leaving}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:text-foreground"
        >
          Skip &rarr;
        </button>
      )}
    </div>
  );
}
