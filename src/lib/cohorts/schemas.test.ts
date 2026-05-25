import { describe, it, expect } from "vitest";
import { cohortCreateSchema, cohortUpdateSchema } from "./schemas";

describe("Cohort Schemas", () => {
  describe("cohortCreateSchema", () => {
    it("validates a valid cohort name", () => {
      const result = cohortCreateSchema.safeParse({ name: "Class 1A" });
      expect(result.success).toBe(true);
    });

    it("rejects empty cohort name", () => {
      const result = cohortCreateSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name is required");
      }
    });

    it("rejects excessively long cohort name", () => {
      const result = cohortCreateSchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe("cohortUpdateSchema", () => {
    it("validates a valid rename", () => {
      const result = cohortUpdateSchema.safeParse({ name: "Updated Class" });
      expect(result.success).toBe(true);
    });
  });
});
