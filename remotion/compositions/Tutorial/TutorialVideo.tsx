import { Series } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

import { themeStyles, type ThemeName } from "./lib/theme-styles";
import {
  SCENE_DASHBOARD_DURATION,
  SCENE_CHECK_TASK_DURATION,
  SCENE_TRACK_WATER_DURATION,
  SCENE_READING_PHOTO_DURATION,
  SCENE_SWIPE_DAYS_DURATION,
  SCENE_ALL_DONE_DURATION,
} from "./lib/constants";

import { SceneDashboard } from "./scenes/SceneDashboard";
import { SceneCheckTask } from "./scenes/SceneCheckTask";
import { SceneTrackWater } from "./scenes/SceneTrackWater";
import { SceneReadingPhoto } from "./scenes/SceneReadingPhoto";
import { SceneSwipeDays } from "./scenes/SceneSwipeDays";
import { SceneAllDone } from "./scenes/SceneAllDone";

// Load Inter as fallback font for Remotion rendering
loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

export type TutorialVideoProps = {
  theme: ThemeName;
  habits: Array<{
    name: string;
    blockType: "task" | "counter";
    target?: number;
    unit?: string;
    isHard: boolean;
    category: string;
  }>;
  displayName: string;
};

export const TutorialVideo: React.FC<TutorialVideoProps> = ({
  theme: themeName,
  habits,
  displayName,
}) => {
  const theme = themeStyles[themeName];

  // Find first task habit and water habit for focused scenes
  const firstTask = habits.find((h) => h.blockType === "task");
  const waterHabit = habits.find(
    (h) => h.blockType === "counter" && h.category === "nutrition"
  );

  return (
    <Series>
      <Series.Sequence durationInFrames={SCENE_DASHBOARD_DURATION}>
        <SceneDashboard
          theme={theme}
          themeName={themeName}
          habits={habits}
          displayName={displayName}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_CHECK_TASK_DURATION}>
        <SceneCheckTask
          theme={theme}
          themeName={themeName}
          taskName={firstTask?.name ?? "Workout 1"}
          habits={habits}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_TRACK_WATER_DURATION}>
        <SceneTrackWater
          theme={theme}
          target={waterHabit?.target ?? 128}
          unit={waterHabit?.unit ?? "oz"}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_READING_PHOTO_DURATION}>
        <SceneReadingPhoto theme={theme} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_SWIPE_DAYS_DURATION}>
        <SceneSwipeDays theme={theme} themeName={themeName} />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_ALL_DONE_DURATION}>
        <SceneAllDone
          theme={theme}
          themeName={themeName}
          displayName={displayName}
          totalHabits={habits.length}
        />
      </Series.Sequence>
    </Series>
  );
};
