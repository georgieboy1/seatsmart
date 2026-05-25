import { describe, expect, it } from "vitest";
import { parseStudentsCsv } from "./csv";

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
