import { describe, expect, it } from "vitest";
import type { Student } from "@/lib/types/student";
import { parseRawTextToGrid, normalizeList, serializeStudentsCsv, prosocialLookup } from "./csv";

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "student-1",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: ["helpful", "focused"],
    antisocialTraits: ["talkative"],
    constraints: ["front_of_room"],
    togetherIds: [],
    separateIds: [],
    healthFlags: [],
    allergies: [],
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseRawTextToGrid", () => {
  it("parses CSV lines correctly", () => {
    const csv = "name,age\nMaya,25\nSam,30";
    expect(parseRawTextToGrid(csv)).toEqual([
      ["name", "age"],
      ["Maya", "25"],
      ["Sam", "30"],
    ]);
  });

  it("handles quoted commas and escaped quotes", () => {
    const csv = 'name,notes\n"Chen, Maya","Likes ""coding"""';
    expect(parseRawTextToGrid(csv)).toEqual([
      ["name", "notes"],
      ["Chen, Maya", 'Likes "coding"'],
    ]);
  });

  it("handles TSV (pasted from Excel)", () => {
    const tsv = "name\tage\nMaya\t25";
    expect(parseRawTextToGrid(tsv)).toEqual([
      ["name", "age"],
      ["Maya", "25"],
    ]);
  });
});

describe("normalizeList", () => {
  it("normalizes known values and identifies unknown ones", () => {
    const { normalized, unknown } = normalizeList("Helpful, Superpower", prosocialLookup);
    expect(normalized).toEqual(["helpful"]);
    expect(unknown).toEqual(["Superpower"]);
  });

  it("handles different delimiters", () => {
    const { normalized: n1 } = normalizeList("helpful;focused", prosocialLookup);
    const { normalized: n2 } = normalizeList("helpful|focused", prosocialLookup);
    expect(n1).toEqual(["helpful", "focused"]);
    expect(n2).toEqual(["helpful", "focused"]);
  });
});

describe("serializeStudentsCsv", () => {
  it("exports an import-compatible CSV", () => {
    expect(serializeStudentsCsv([makeStudent()])).toBe(
      [
        "name,prosocial,antisocial,constraints",
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
});
