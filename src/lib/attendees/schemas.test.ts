import { describe, expect, it } from "vitest";
import { attendeeCreateSchema } from "./schemas";

const externalId = "11111111-1111-4111-8111-111111111111";
const otherAttendeeId = "22222222-2222-4222-8222-222222222222";

describe("attendeeCreateSchema", () => {
  it("accepts a valid attendee", () => {
    const result = attendeeCreateSchema.safeParse({
      name: " Maya Chen ",
      prosocialTraits: ["helpful", "focused"],
      antisocialTraits: ["talkative"],
      constraints: ["front_of_room"],
      togetherIds: [externalId],
      separateIds: [otherAttendeeId],
      notes: "Works well with clear directions.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Maya Chen");
      expect(result.data.notes).toBe("Works well with clear directions.");
    }
  });

  it("converts blank notes to null", () => {
    const result = attendeeCreateSchema.safeParse({
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
    const result = attendeeCreateSchema.safeParse({
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
    const result = attendeeCreateSchema.safeParse({
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
    const result = attendeeCreateSchema.safeParse({
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

  it("rejects attendees who appear in both peer tutors and separateIds", () => {
    const result = attendeeCreateSchema.safeParse({
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
