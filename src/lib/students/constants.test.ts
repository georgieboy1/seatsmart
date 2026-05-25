import { describe, it, expect } from "vitest";
import {
  ACCOMMODATIONS,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "./constants";

describe("student constants", () => {
  it("has a non-empty list of prosocial and antisocial traits", () => {
    expect(PROSOCIAL_TRAITS.length).toBeGreaterThan(0);
    expect(ANTISOCIAL_TRAITS.length).toBeGreaterThan(0);
  });

  it("prosocial and antisocial values do not overlap", () => {
    const pro = PROSOCIAL_TRAITS.map((t) => t.value as string);
    const anti = new Set(ANTISOCIAL_TRAITS.map((t) => t.value as string));
    for (const v of pro) {
      expect(anti.has(v)).toBe(false);
    }
  });

  it("accommodations include all 8 spec §3 entries", () => {
    expect(ACCOMMODATIONS.map((a) => a.value).slice().sort()).toEqual([
      "away_from_window",
      "front_of_room",
      "hearing_left",
      "hearing_right",
      "near_charging",
      "near_door",
      "near_teacher",
      "vision_front",
    ]);
  });

  it("every option has a non-empty label", () => {
    const all = [
      ...PROSOCIAL_TRAITS,
      ...ANTISOCIAL_TRAITS,
      ...ACCOMMODATIONS,
    ];
    for (const item of all) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});
