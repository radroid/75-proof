import type { ThemeStyle } from "../lib/theme-styles";
import type { TutorialVideoProps } from "../TutorialVideo";
import { MockTaskItem } from "./MockTaskItem";
import { MockCounterItem } from "./MockCounterItem";

type CheckState = {
  checkedTasks: string[];
  counterFills: Record<string, number>;
  checkDelay?: number;
  fillDelay?: number;
};

type MockChecklistProps = {
  habits: TutorialVideoProps["habits"];
  theme: ThemeStyle;
  state: CheckState;
};

/**
 * Renders a list of habit items matching the real DynamicDailyChecklist layout.
 * Groups by category with section headers.
 */
export const MockChecklist: React.FC<MockChecklistProps> = ({
  habits,
  theme,
  state,
}) => {
  // Group by category (like real DynamicDailyChecklist)
  const categories = ["fitness", "nutrition", "mind"];
  const grouped = categories.map((cat) => ({
    category: cat,
    items: habits.filter((h) => h.category === cat),
  })).filter((g) => g.items.length > 0);

  const categoryLabels: Record<string, string> = {
    fitness: "Fitness",
    nutrition: "Nutrition",
    mind: "Mind & Progress",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grouped.map((group) => {
        const groupDone = group.items.every((h) =>
          h.blockType === "task"
            ? state.checkedTasks.includes(h.name)
            : (state.counterFills[h.name] ?? 0) >= 1
        );

        return (
          <div key={group.category}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 4,
            }}>
              <span style={{
                fontFamily: theme.fontBody, fontSize: 12, fontWeight: 600,
                color: theme.fg, textTransform: "uppercase" as const, letterSpacing: 1,
              }}>
                {categoryLabels[group.category] ?? group.category}
              </span>
              {groupDone && (
                <span style={{
                  fontSize: 8, fontFamily: theme.fontBody,
                  padding: "2px 6px", borderRadius: 4,
                  background: theme.success + "1a", color: theme.success,
                  fontWeight: 600,
                }}>
                  Done
                </span>
              )}
            </div>

            {/* Items */}
            {group.items.map((habit) => {
              if (habit.blockType === "task") {
                return (
                  <MockTaskItem
                    key={habit.name}
                    name={habit.name}
                    theme={theme}
                    isHard={habit.isHard}
                    checked={state.checkedTasks.includes(habit.name)}
                    checkDelay={state.checkDelay ?? 0}
                  />
                );
              }
              return (
                <MockCounterItem
                  key={habit.name}
                  name={habit.name}
                  target={habit.target ?? 100}
                  unit={habit.unit ?? ""}
                  theme={theme}
                  isHard={habit.isHard}
                  fillProgress={state.counterFills[habit.name] ?? 0}
                  fillDelay={state.fillDelay ?? 0}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
