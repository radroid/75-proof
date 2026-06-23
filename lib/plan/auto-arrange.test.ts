import { describe, it, expect } from "vitest";
import { autoArrange, type ArrangeInput } from "./auto-arrange";

const base: ArrangeInput = {
  workEndMin: 17 * 60 + 30, // 17:30 = 1050
  windDownMin: 22 * 60, // 22:00 = 1320
  nowMin: 17 * 60 + 20, // 17:20 = 1040
  habits: [],
};

describe("autoArrange", () => {
  it("places habits after work with buffer + gaps", () => {
    const res = autoArrange({
      ...base,
      habits: [
        { id: "a", durationMin: 45 },
        { id: "b", durationMin: 20 },
        { id: "c", durationMin: 10 },
      ],
    });
    // base = max(1040, 1050) = 1050; +15 buffer = 1065
    expect(res.blocks.map((b) => b.startMin)).toEqual([1065, 1120, 1150]);
    expect(res.blocks.map((b) => b.habitId)).toEqual(["a", "b", "c"]);
    expect(res.overflow).toBe(false);
  });

  it("starts from now when now is past work end", () => {
    const res = autoArrange({
      ...base,
      nowMin: 20 * 60, // 1200
      habits: [{ id: "a", durationMin: 30 }],
    });
    // base = max(1200, 1050) = 1200; +15 = 1215
    expect(res.blocks[0].startMin).toBe(1215);
  });

  it("starts from now (no buffer) when there is no work today", () => {
    const res = autoArrange({
      ...base,
      workEndMin: null,
      nowMin: 18 * 60, // 1080
      habits: [{ id: "a", durationMin: 30 }],
    });
    expect(res.blocks[0].startMin).toBe(1080);
  });

  it("routes around fixed intervals without overlapping", () => {
    const res = autoArrange({
      ...base,
      habits: [{ id: "a", durationMin: 30 }],
      fixed: [{ startMin: 1080, durationMin: 30 }], // 18:00–18:30
    });
    // wants 1065–1095, conflicts with 1080–1110 -> jumps to ceil5(1110+10)=1120
    expect(res.blocks[0].startMin).toBe(1120);
    expect(res.blocks[0].startMin + res.blocks[0].durationMin).toBeLessThanOrEqual(
      base.windDownMin,
    );
  });

  it("compresses and flags overflow when the window is too tight", () => {
    const res = autoArrange({
      ...base,
      workEndMin: 20 * 60, // 1200
      nowMin: 19 * 60, // 1140
      windDownMin: 22 * 60, // 1320
      habits: [
        { id: "a", durationMin: 60 },
        { id: "b", durationMin: 60 },
        { id: "c", durationMin: 60 },
      ],
    });
    // compressed: starts at 1200, back-to-back -> 1200, 1260, 1320; last ends 1380 > 1320
    expect(res.blocks.map((b) => b.startMin)).toEqual([1200, 1260, 1320]);
    expect(res.overflow).toBe(true);
  });

  it("returns nothing for no habits", () => {
    const res = autoArrange({ ...base, habits: [] });
    expect(res.blocks).toEqual([]);
    expect(res.overflow).toBe(false);
  });

  it("enforces a minimum 5-minute block", () => {
    const res = autoArrange({ ...base, habits: [{ id: "a", durationMin: 0 }] });
    expect(res.blocks[0].durationMin).toBe(5);
  });

  it("keeps all start times on the 5-minute grid", () => {
    const res = autoArrange({
      ...base,
      workEndMin: 17 * 60 + 33, // 17:33 (not on grid)
      habits: [
        { id: "a", durationMin: 23 },
        { id: "b", durationMin: 17 },
      ],
    });
    for (const b of res.blocks) {
      expect(b.startMin % 5).toBe(0);
    }
  });
});
