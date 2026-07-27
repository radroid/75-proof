import { beforeEach, describe, expect, it } from "vitest";
import {
  PERSONALITY_STORAGE_KEY,
  THEME_RESET_STORAGE_KEY,
  defaultThemeConfig,
  resolveStoredPersonality,
} from "./themes";

const DEFAULT = defaultThemeConfig.personality;

describe("resolveStoredPersonality", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the default when nothing is stored, and marks the reset as done", () => {
    expect(resolveStoredPersonality()).toBe(DEFAULT);
    expect(localStorage.getItem(THEME_RESET_STORAGE_KEY)).toBe("1");
  });

  it("resets a stale pre-rebrand 'arctic' pin to the default exactly once", () => {
    // A pre-#94 browser: the old code persisted the then-default "arctic".
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "arctic");

    // First load after the fix ships: arctic -> default, marker set.
    expect(resolveStoredPersonality()).toBe(DEFAULT);
    expect(localStorage.getItem(PERSONALITY_STORAGE_KEY)).toBe(DEFAULT);
    expect(localStorage.getItem(THEME_RESET_STORAGE_KEY)).toBe("1");
  });

  it("keeps a deliberate 'arctic' pick made after the reset has run", () => {
    // Marker already present => the one-time reset has fired for this browser.
    localStorage.setItem(THEME_RESET_STORAGE_KEY, "1");
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "arctic");

    expect(resolveStoredPersonality()).toBe("arctic");
    expect(localStorage.getItem(PERSONALITY_STORAGE_KEY)).toBe("arctic");
  });

  it("does not touch a deliberate non-arctic theme during the reset pass", () => {
    // broadsheet was never a default, so it can only be a deliberate choice.
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "broadsheet");

    expect(resolveStoredPersonality()).toBe("broadsheet");
    expect(localStorage.getItem(PERSONALITY_STORAGE_KEY)).toBe("broadsheet");
    expect(localStorage.getItem(THEME_RESET_STORAGE_KEY)).toBe("1");
  });

  it("leaves 'earned' untouched", () => {
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "earned");
    expect(resolveStoredPersonality()).toBe("earned");
  });

  it("migrates a removed legacy theme name to the default on every load", () => {
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "brutalist");
    expect(resolveStoredPersonality()).toBe(DEFAULT);
    expect(localStorage.getItem(PERSONALITY_STORAGE_KEY)).toBe(DEFAULT);
  });

  it("sets the reset marker when migrating a removed theme, so a later arctic pick survives", () => {
    // A removed-theme migration returns early; it must still mark the one-time
    // reset as done, or a subsequent deliberate arctic pick would be wiped.
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "brutalist");
    resolveStoredPersonality(); // brutalist -> default, marker set
    expect(localStorage.getItem(THEME_RESET_STORAGE_KEY)).toBe("1");

    // User then deliberately picks arctic.
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "arctic");
    expect(resolveStoredPersonality()).toBe("arctic");
    expect(localStorage.getItem(PERSONALITY_STORAGE_KEY)).toBe("arctic");
  });

  it("is idempotent across reloads for a reset arctic user", () => {
    localStorage.setItem(PERSONALITY_STORAGE_KEY, "arctic");
    resolveStoredPersonality(); // arctic -> default
    // Second load: value is now the default and the marker is set.
    expect(resolveStoredPersonality()).toBe(DEFAULT);
  });
});
