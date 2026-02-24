import { Composition, Folder } from "remotion";
import { TutorialVideo } from "./compositions/Tutorial/TutorialVideo";
import { COMP_WIDTH, COMP_HEIGHT, FPS, TOTAL_FRAMES } from "./compositions/Tutorial/lib/constants";
import { defaultTutorialProps } from "./compositions/Tutorial/lib/mock-data";
import type { ThemeName } from "./compositions/Tutorial/lib/theme-styles";

const THEMES: ThemeName[] = ["arctic", "broadsheet", "military", "zen"];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Default composition (arctic) */}
      <Composition
        id="Tutorial"
        component={TutorialVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={COMP_WIDTH}
        height={COMP_HEIGHT}
        defaultProps={defaultTutorialProps}
      />

      {/* Per-theme compositions for preview */}
      <Folder name="Themes">
        {THEMES.map((themeName) => (
          <Composition
            key={themeName}
            id={`Tutorial-${themeName}`}
            component={TutorialVideo}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            width={COMP_WIDTH}
            height={COMP_HEIGHT}
            defaultProps={{
              ...defaultTutorialProps,
              theme: themeName,
            }}
          />
        ))}
      </Folder>
    </>
  );
};
