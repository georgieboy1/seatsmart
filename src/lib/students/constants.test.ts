import { describe, it, expect } from "vitest";
import {
  DIETARY_ACCESSIBILITY,
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

  it("constraints include all 16 expanded spec entries", () => {
    expect(DIETARY_ACCESSIBILITY.map((a) => a.value).slice().sort()).toEqual([
      "away_from_window",
      "dairy-free",
      "front_of_room",
      "gluten-free",
      "hearing_left",
      "hearing_right",
      "low-hearing",
      "near_charging",
      "near_door",
      "near_teacher",
      "nut-allergy",
      "service-animal",
      "vegan",
      "vegetarian",
      "vision_front",
      "wheelchair-access",
    ]);
  });

  it("every option has a non-empty label", () => {
    const all = [
      ...PROSOCIAL_TRAITS,
      ...ANTISOCIAL_TRAITS,
      ...DIETARY_ACCESSIBILITY,
    ];
    for (const item of all) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});
