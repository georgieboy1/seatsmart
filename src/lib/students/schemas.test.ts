import { describe, expect, it } from "vitest";
import { studentCreateSchema } from "./schemas";

const externalId = "11111111-1111-4111-8111-111111111111";
const otherStudentId = "22222222-2222-4222-8222-222222222222";

describe("studentCreateSchema", () => {
  it("accepts a valid student", () => {
    const result = studentCreateSchema.safeParse({
      name: " Maya Chen ",
      prosocialTraits: ["helpful", "focused"],
      antisocialTraits: ["talkative"],
      constraints: ["front_of_room"],
      togetherIds: [externalId],
      separateIds: [otherStudentId],
      notes: "Works well with clear directions.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Maya Chen");
      expect(result.data.notes).toBe("Works well with clear directions.");
    }
  });

  it("converts blank notes to null", () => {
    const result = studentCreateSchema.safeParse({
      name: "Maya Chen",
      prosocialTraits: [],
      antisocialTraits: [],
      constraints: [],
      togetherIds: [],
      separateIds: [],
      notes: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects an empty name", () => {
    const result = studentCreateSchema.safeParse({
      name: " ",
      prosocialTraits: [],
      antisocialTraits: [],
      constraints: [],
      togetherIds: [],
      separateIds: [],
      notes: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown trait values", () => {
    const result = studentCreateSchema.safeParse({
      name: "Maya Chen",
      prosocialTraits: ["invented_trait"],
      antisocialTraits: [],
      constraints: [],
      togetherIds: [],
      separateIds: [],
      notes: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid peer tutor ids", () => {
    const result = studentCreateSchema.safeParse({
      name: "Maya Chen",
      prosocialTraits: [],
      antisocialTraits: [],
      constraints: [],
      togetherIds: ["not-a-uuid"],
      separateIds: [],
      notes: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects students who appear in both peer tutors and separateIds", () => {
    const result = studentCreateSchema.safeParse({
      name: "Maya Chen",
      prosocialTraits: [],
      antisocialTraits: [],
      constraints: [],
      togetherIds: [externalId],
      separateIds: [externalId],
      notes: null,
    });

    expect(result.success).toBe(false);
  });
});
