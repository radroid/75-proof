import type { TutorialVideoProps } from "../TutorialVideo";

export const defaultHabits: TutorialVideoProps["habits"] = [
  { name: "Workout 1", blockType: "task", isHard: true, category: "fitness" },
  {
    name: "Workout 2 (Outdoor)",
    blockType: "task",
    isHard: true,
    category: "fitness",
  },
  {
    name: "Water",
    blockType: "counter",
    target: 128,
    unit: "oz",
    isHard: true,
    category: "nutrition",
  },
  {
    name: "Follow Diet",
    blockType: "task",
    isHard: true,
    category: "nutrition",
  },
  { name: "No Alcohol", blockType: "task", isHard: true, category: "nutrition" },
  {
    name: "Reading",
    blockType: "counter",
    target: 20,
    unit: "min",
    isHard: true,
    category: "mind",
  },
  {
    name: "Progress Photo",
    blockType: "task",
    isHard: true,
    category: "mind",
  },
];

export const defaultTutorialProps: TutorialVideoProps = {
  theme: "arctic",
  habits: defaultHabits,
  displayName: "Challenger",
};
