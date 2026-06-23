import { describe, it, expect } from "vitest";
import {
  defaultDuration,
  inferPlacement,
  resolveDuration,
  resolvePlacement,
  type HabitLike,
} from "./duration-heuristics";

const h = (over: Partial<HabitLike>): HabitLike => ({
  name: "Habit",
  blockType: "task",
  ...over,
});

describe("defaultDuration", () => {
  it("uses counter minutes target directly", () => {
    expect(defaultDuration(h({ blockType: "counter", target: 20, unit: "min" }))).toBe(20);
    expect(defaultDuration(h({ blockType: "counter", target: 30, unit: "minutes" }))).toBe(30);
  });
  it("estimates reading from pages", () => {
    expect(defaultDuration(h({ blockType: "counter", target: 10, unit: "pages" }))).toBe(15);
  });
  it("maps names to sensible defaults", () => {
    expect(defaultDuration(h({ name: "Morning Workout" }))).toBe(45);
    expect(defaultDuration(h({ name: "Meditate" }))).toBe(10);
    expect(defaultDuration(h({ name: "Journal" }))).toBe(15);
    expect(defaultDuration(h({ name: "Read 10 pages" }))).toBe(20);
  });
  it("falls back to category, then 15", () => {
    expect(defaultDuration(h({ name: "Mystery", category: "fitness" }))).toBe(45);
    expect(defaultDuration(h({ name: "Mystery", category: "mind" }))).toBe(15);
    expect(defaultDuration(h({ name: "Mystery" }))).toBe(15);
  });
  it("clamps absurd counter targets", () => {
    expect(defaultDuration(h({ blockType: "counter", target: 9999, unit: "min" }))).toBe(240);
    expect(defaultDuration(h({ blockType: "counter", target: 1, unit: "min" }))).toBe(5);
  });
});

describe("resolveDuration", () => {
  it("prefers explicit estimatedMinutes", () => {
    expect(resolveDuration(h({ name: "Workout", estimatedMinutes: 30 }))).toBe(30);
  });
  it("ignores non-positive overrides", () => {
    expect(resolveDuration(h({ name: "Workout", estimatedMinutes: 0 }))).toBe(45);
  });
});

describe("inferPlacement", () => {
  it("sends counters with a target to the timeline", () => {
    expect(inferPlacement(h({ blockType: "counter", target: 128, unit: "oz", name: "Water" }))).toBe("timeline");
  });
  it("sends abstinence habits to anytime", () => {
    expect(inferPlacement(h({ name: "No alcohol" }))).toBe("anytime");
    expect(inferPlacement(h({ name: "Quit smoking" }))).toBe("anytime");
    expect(inferPlacement(h({ name: "No cheat meals" }))).toBe("anytime");
  });
  it("sends diet-adherence habits to anytime", () => {
    expect(inferPlacement(h({ name: "Follow a diet" }))).toBe("anytime");
    expect(inferPlacement(h({ name: "Clean eating" }))).toBe("anytime");
  });
  it("sends normal duration habits to the timeline", () => {
    expect(inferPlacement(h({ name: "Workout" }))).toBe("timeline");
    expect(inferPlacement(h({ name: "Read" }))).toBe("timeline");
  });
  it("keeps named activities on the timeline despite abstinence/diet substrings", () => {
    expect(inferPlacement(h({ name: "No-equipment workout" }))).toBe("timeline");
    expect(inferPlacement(h({ name: "Zero to one reading" }))).toBe("timeline");
    expect(inferPlacement(h({ name: "Sugar-free baking practice" }))).toBe(
      "timeline",
    );
  });
  it("does not match activity words inside other words", () => {
    // "read" inside "bread" must not pull an abstinence habit to the timeline.
    expect(inferPlacement(h({ name: "No bread" }))).toBe("anytime");
  });
});

describe("resolvePlacement", () => {
  it("prefers explicit defaultPlacement", () => {
    expect(resolvePlacement(h({ name: "No alcohol", defaultPlacement: "timeline" }))).toBe("timeline");
    expect(resolvePlacement(h({ name: "Workout", defaultPlacement: "anytime" }))).toBe("anytime");
  });
});
