import { describe, expect, it } from "vitest";
import type { Attendee } from "@/lib/types/attendee";
import { parseAttendeesCsv, serializeAttendeesCsv } from "./csv";

function makeAttendee(overrides: Partial<Attendee> = {}): Attendee {
  return {
    id: "attendee-1",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: ["helpful", "focused"],
    antisocialTraits: ["talkative"],
    constraints: ["front_of_room"],
    togetherIds: [],
    separateIds: [],
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseAttendeesCsv", () => {
  it("parses the required roster columns", () => {
    expect(
      parseAttendeesCsv(
        [
          "name,prosocial,antisocial,constraints",
          'Maya Chen,"Helpful; Focused",Talkative,"Front of room; Near teacher"',
        ].join("\n"),
      ),
    ).toEqual([
      {
        name: "Maya Chen",
        prosocialTraits: ["helpful", "focused"],
        antisocialTraits: ["talkative"],
        constraints: ["front_of_room", "near_teacher"],
        togetherIds: [],
        separateIds: [],
        notes: null,
      },
    ]);
  });

  it("handles quoted commas inside cells", () => {
    expect(
      parseAttendeesCsv(
        [
          "name,prosocial,antisocial,constraints",
          '"Chen, Maya","helpful, focused",talkative,vision_front',
        ].join("\n"),
      )[0],
    ).toMatchObject({
      name: "Chen, Maya",
      prosocialTraits: ["helpful", "focused"],
      constraints: ["vision_front"],
    });
  });

  it("deduplicates repeated values", () => {
    expect(
      parseAttendeesCsv(
        [
          "name,prosocial,antisocial,constraints",
          'Maya Chen,"helpful; Helpful",talkative,vision_front',
        ].join("\n"),
      )[0].prosocialTraits,
    ).toEqual(["helpful"]);
  });

  it("rejects missing required columns", () => {
    expect(() => parseAttendeesCsv("name,prosocial\nMaya,helpful")).toThrow(
      /missing required column: antisocial/i,
    );
  });

  it("rejects unknown trait values with row context", () => {
    expect(() =>
      parseAttendeesCsv(
        [
          "name,prosocial,antisocial,constraints",
          "Maya Chen,superpower,talkative,vision_front",
        ].join("\n"),
      ),
    ).toThrow(/row 2: unknown prosocial value "superpower"/i);
  });

  it("rejects blank attendee names with row context", () => {
    expect(() =>
      parseAttendeesCsv(
        ["name,prosocial,antisocial,constraints", ",helpful,,"].join("\n"),
      ),
    ).toThrow(/row 2: name is required/i);
  });
});

describe("serializeAttendeesCsv", () => {
  it("exports an import-compatible CSV", () => {
    expect(serializeAttendeesCsv([makeAttendee()])).toBe(
      [
        "name,prosocial,antisocial,constraints",
        "Maya Chen,helpful; focused,talkative,front_of_room",
        "",
      ].join("\n"),
    );
  });

  it("escapes names and values containing commas or quotes", () => {
    expect(
      serializeAttendeesCsv([
        makeAttendee({
          name: 'Chen, "Maya"',
          prosocialTraits: ["helpful"],
          antisocialTraits: [],
          constraints: ["vision_front", "near_teacher"],
        }),
      ]),
    ).toBe(
      [
        "name,prosocial,antisocial,constraints",
        '"Chen, ""Maya""",helpful,,vision_front; near_teacher',
        "",
      ].join("\n"),
    );
  });

  it("round-trips through the importer for supported columns", () => {
    const exported = serializeAttendeesCsv([
      makeAttendee({
        name: "Sam Patel",
        prosocialTraits: ["leader"],
        antisocialTraits: ["restless"],
        constraints: ["near_door", "away_from_window"],
      }),
    ]);

    expect(parseAttendeesCsv(exported)).toEqual([
      {
        name: "Sam Patel",
        prosocialTraits: ["leader"],
        antisocialTraits: ["restless"],
        constraints: ["near_door", "away_from_window"],
        togetherIds: [],
        separateIds: [],
        notes: null,
      },
    ]);
  });
});
