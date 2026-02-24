/**
 * Standard 75 HARD habit definitions.
 * Used as the default set when creating a new challenge through onboarding.
 */

export interface StandardHabit {
  name: string;
  blockType: "task" | "counter";
  target?: number;
  unit?: string;
  isHard: boolean;
  category: string;
  icon: string;
  sortOrder: number;
}

export const STANDARD_HABITS: StandardHabit[] = [
  {
    name: "Workout 1",
    blockType: "task",
    isHard: true,
    category: "fitness",
    icon: "dumbbell",
    sortOrder: 1,
  },
  {
    name: "Workout 2 (Outdoor)",
    blockType: "task",
    isHard: true,
    category: "fitness",
    icon: "sun",
    sortOrder: 2,
  },
  {
    name: "Water",
    blockType: "counter",
    target: 128,
    unit: "oz",
    isHard: true,
    category: "nutrition",
    icon: "droplets",
    sortOrder: 3,
  },
  {
    name: "Follow Diet",
    blockType: "task",
    isHard: true,
    category: "nutrition",
    icon: "apple",
    sortOrder: 4,
  },
  {
    name: "No Alcohol",
    blockType: "task",
    isHard: true,
    category: "nutrition",
    icon: "ban",
    sortOrder: 5,
  },
  {
    name: "Reading",
    blockType: "counter",
    target: 20,
    unit: "min",
    isHard: true,
    category: "mind",
    icon: "book-open",
    sortOrder: 6,
  },
  {
    name: "Progress Photo",
    blockType: "task",
    isHard: true,
    category: "mind",
    icon: "camera",
    sortOrder: 7,
  },
];
