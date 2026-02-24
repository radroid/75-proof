"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Player, type PlayerRef } from "@remotion/player";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TutorialVideo } from "@/remotion/compositions/Tutorial/TutorialVideo";
import { TOTAL_FRAMES, FPS, COMP_WIDTH, COMP_HEIGHT } from "@/remotion/compositions/Tutorial/lib/constants";
import type { ThemeName } from "@/remotion/compositions/Tutorial/lib/theme-styles";
import { defaultTutorialProps } from "@/remotion/compositions/Tutorial/lib/mock-data";

const STORAGE_KEY = "75hard-onboarding-state";

export default function TutorialPage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const markSeen = useMutation(api.users.markTutorialSeen);
  const playerRef = useRef<PlayerRef>(null);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);

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
        setProps((p) => ({ ...p, displayName: user.displayName }));
      }
    } catch {
      // ignore parse errors
    }
  }, [user]);

  // Guard: if user already saw the tutorial, go to dashboard
  useEffect(() => {
    if (user?.hasSeenTutorial) {
      router.replace("/dashboard");
    }
  }, [user?.hasSeenTutorial, router]);

  const goToDashboard = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await markSeen();
    } catch {
      // proceed even if mutation fails
    }
    sessionStorage.removeItem(STORAGE_KEY);
    router.push("/dashboard");
  }, [leaving, markSeen, router]);

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
      <div className="bg-background min-h-dvh flex items-center justify-center">
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #e5e7eb", borderTopColor: "#2563eb" }} />
      </div>
    );
  }

  if (user === null) {
    router.replace("/sign-in");
    return null;
  }

  return (
    <div className="bg-background min-h-dvh flex flex-col items-center justify-center p-4 gap-5">
      <div style={{ width: "100%", maxWidth: COMP_WIDTH }}>
        <Player
          ref={playerRef}
          component={TutorialVideo}
          inputProps={props}
          durationInFrames={TOTAL_FRAMES}
          compositionWidth={COMP_WIDTH}
          compositionHeight={COMP_HEIGHT}
          fps={FPS}
          autoPlay
          style={{
            width: "100%",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        />

        {/* Progress bar */}
        <div
          style={{
            marginTop: 8,
            height: 4,
            borderRadius: 2,
            background: "var(--muted, #e5e7eb)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: "var(--primary, #2563eb)",
              borderRadius: 2,
              transition: "width 0.15s linear",
            }}
          />
        </div>
      </div>

      <button
        onClick={goToDashboard}
        disabled={leaving}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted-foreground, #6b7280)",
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
          padding: "8px 16px",
          opacity: leaving ? 0.5 : 1,
        }}
      >
        Skip &rarr;
      </button>
    </div>
  );
}
