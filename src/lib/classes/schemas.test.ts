import { describe, it, expect } from "vitest";
import { classCreateSchema, classUpdateSchema } from "./schemas";

describe("Class Schemas", () => {
  describe("classCreateSchema", () => {
    it("validates a valid class name", () => {
      const result = classCreateSchema.safeParse({ name: "Class 1A" });
      expect(result.success).toBe(true);
    });

    it("rejects empty class name", () => {
      const result = classCreateSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name is required");
      }
    });

    it("rejects excessively long class name", () => {
      const result = classCreateSchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe("classUpdateSchema", () => {
    it("validates a valid rename", () => {
      const result = classUpdateSchema.safeParse({ name: "Updated Class" });
      expect(result.success).toBe(true);
    });
  });
});
