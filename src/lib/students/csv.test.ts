import { describe, expect, it } from "vitest";
import type { Student } from "@/lib/types/student";
import { parseStudentsCsv, serializeStudentsCsv } from "./csv";

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "student-1",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: ["helpful", "focused"],
    antisocialTraits: ["talkative"],
    accommodations: ["front_of_room"],
    peerTutors: [],
    avoid: [],
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseStudentsCsv", () => {
  it("parses the required roster columns", () => {
    expect(
      parseStudentsCsv(
        [
          "name,prosocial,antisocial,accommodations",
          'Maya Chen,"Helpful; Focused",Talkative,"Front of room; Near teacher"',
        ].join("\n"),
      ),
    ).toEqual([
      {
        name: "Maya Chen",
        prosocialTraits: ["helpful", "focused"],
        antisocialTraits: ["talkative"],
        accommodations: ["front_of_room", "near_teacher"],
        peerTutors: [],
        avoid: [],
        notes: null,
      },
    ]);
  });

  it("handles quoted commas inside cells", () => {
    expect(
      parseStudentsCsv(
        [
          "name,prosocial,antisocial,accommodations",
          '"Chen, Maya","helpful, focused",talkative,vision_front',
        ].join("\n"),
      )[0],
    ).toMatchObject({
      name: "Chen, Maya",
      prosocialTraits: ["helpful", "focused"],
      accommodations: ["vision_front"],
    });
  });

  it("deduplicates repeated values", () => {
    expect(
      parseStudentsCsv(
        [
          "name,prosocial,antisocial,accommodations",
          'Maya Chen,"helpful; Helpful",talkative,vision_front',
        ].join("\n"),
      )[0].prosocialTraits,
    ).toEqual(["helpful"]);
  });

  it("rejects missing required columns", () => {
    expect(() => parseStudentsCsv("name,prosocial\nMaya,helpful")).toThrow(
      /missing required column: antisocial/i,
    );
  });

  it("rejects unknown trait values with row context", () => {
    expect(() =>
      parseStudentsCsv(
        [
          "name,prosocial,antisocial,accommodations",
          "Maya Chen,superpower,talkative,vision_front",
        ].join("\n"),
      ),
    ).toThrow(/row 2: unknown prosocial value "superpower"/i);
  });

  it("rejects blank student names with row context", () => {
    expect(() =>
      parseStudentsCsv(
        ["name,prosocial,antisocial,accommodations", ",helpful,,"].join("\n"),
      ),
    ).toThrow(/row 2: name is required/i);
  });
});

describe("serializeStudentsCsv", () => {
  it("exports an import-compatible CSV", () => {
    expect(serializeStudentsCsv([makeStudent()])).toBe(
      [
        "name,prosocial,antisocial,accommodations",
        "Maya Chen,helpful; focused,talkative,front_of_room",
        "",
      ].join("\n"),
    );
  });

  it("escapes names and values containing commas or quotes", () => {
    expect(
      serializeStudentsCsv([
        makeStudent({
          name: 'Chen, "Maya"',
          prosocialTraits: ["helpful"],
          antisocialTraits: [],
          accommodations: ["vision_front", "near_teacher"],
        }),
      ]),
    ).toBe(
      [
        "name,prosocial,antisocial,accommodations",
        '"Chen, ""Maya""",helpful,,vision_front; near_teacher',
        "",
      ].join("\n"),
    );
  });

  it("round-trips through the importer for supported columns", () => {
    const exported = serializeStudentsCsv([
      makeStudent({
        name: "Sam Patel",
        prosocialTraits: ["leader"],
        antisocialTraits: ["restless"],
        accommodations: ["near_door", "away_from_window"],
      }),
    ]);

    expect(parseStudentsCsv(exported)).toEqual([
      {
        name: "Sam Patel",
        prosocialTraits: ["leader"],
        antisocialTraits: ["restless"],
        accommodations: ["near_door", "away_from_window"],
        peerTutors: [],
        avoid: [],
        notes: null,
      },
    ]);
  });
});
