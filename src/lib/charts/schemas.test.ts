import { describe, it, expect } from "vitest";
import { chartUpdateSchema } from "./schemas";

describe("Chart Schemas", () => {
  describe("chartUpdateSchema", () => {
    it("validates partial updates", () => {
      const result = chartUpdateSchema.safeParse({ name: "Updated Chart" });
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Updated Chart");
    });

    it("validates stale status updates", () => {
      const result = chartUpdateSchema.safeParse({ 
        stale: false, 
        staleReasons: [] 
      });
      expect(result.success).toBe(true);
      expect(result.data?.stale).toBe(false);
      expect(result.data?.staleReasons).toEqual([]);
    });

    it("validates assignments record", () => {
      const result = chartUpdateSchema.safeParse({ 
        assignments: { "seat-0-0": "attendee-1" } 
      });
      expect(result.success).toBe(true);
      expect(result.data?.assignments).toEqual({ "seat-0-0": "attendee-1" });
    });

    it("rejects invalid score type", () => {
      const result = chartUpdateSchema.safeParse({ score: "not-a-number" });
      expect(result.success).toBe(false);
    });
  });
});
