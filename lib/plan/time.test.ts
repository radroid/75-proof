import { describe, it, expect } from "vitest";
import {
  hhmmToMin,
  minToHHmm,
  snapTo5,
  ceilTo5,
  clampMin,
  formatClock,
  formatDuration,
  nowMinutesInTz,
} from "./time";

describe("hhmmToMin", () => {
  it("parses valid times", () => {
    expect(hhmmToMin("00:00")).toBe(0);
    expect(hhmmToMin("09:30")).toBe(570);
    expect(hhmmToMin("23:59")).toBe(1439);
    expect(hhmmToMin("9:05")).toBe(545);
  });
  it("throws on malformed or out-of-range input", () => {
    expect(() => hhmmToMin("")).toThrow();
    expect(() => hhmmToMin("24:00")).toThrow();
    expect(() => hhmmToMin("12:60")).toThrow();
    expect(() => hhmmToMin("noon")).toThrow();
  });
});

describe("minToHHmm", () => {
  it("formats and zero-pads", () => {
    expect(minToHHmm(0)).toBe("00:00");
    expect(minToHHmm(570)).toBe("09:30");
    expect(minToHHmm(1439)).toBe("23:59");
  });
  it("wraps past midnight", () => {
    expect(minToHHmm(1440)).toBe("00:00");
    expect(minToHHmm(1500)).toBe("01:00");
    expect(minToHHmm(-60)).toBe("23:00");
  });
  it("round-trips with hhmmToMin", () => {
    for (const t of ["00:00", "06:45", "13:20", "23:55"]) {
      expect(minToHHmm(hhmmToMin(t))).toBe(t);
    }
  });
});

describe("snapTo5 / ceilTo5", () => {
  it("snaps to nearest 5", () => {
    expect(snapTo5(0)).toBe(0);
    expect(snapTo5(2)).toBe(0);
    expect(snapTo5(3)).toBe(5);
    expect(snapTo5(67)).toBe(65);
    expect(snapTo5(68)).toBe(70);
  });
  it("ceils to next 5", () => {
    expect(ceilTo5(0)).toBe(0);
    expect(ceilTo5(1)).toBe(5);
    expect(ceilTo5(65)).toBe(65);
    expect(ceilTo5(66)).toBe(70);
  });
});

describe("clampMin", () => {
  it("clamps into range", () => {
    expect(clampMin(5, 0, 10)).toBe(5);
    expect(clampMin(-3, 0, 10)).toBe(0);
    expect(clampMin(99, 0, 10)).toBe(10);
  });
});

describe("formatClock", () => {
  it("renders 12h with period", () => {
    expect(formatClock(0)).toBe("12:00 AM");
    expect(formatClock(570)).toBe("9:30 AM");
    expect(formatClock(720)).toBe("12:00 PM");
    expect(formatClock(870)).toBe("2:30 PM");
    expect(formatClock(1439)).toBe("11:59 PM");
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(75)).toBe("1h 15m");
    expect(formatDuration(0)).toBe("0 min");
  });
});

describe("nowMinutesInTz", () => {
  it("computes local minutes from midnight (DST-aware)", () => {
    const at = new Date("2026-06-23T14:30:00Z");
    expect(nowMinutesInTz("UTC", at)).toBe(14 * 60 + 30);
    // June -> America/New_York is EDT (UTC-4) => 10:30 local.
    expect(nowMinutesInTz("America/New_York", at)).toBe(10 * 60 + 30);
  });
});
