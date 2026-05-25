import { describe, it, expect } from "vitest";
import { rowToLayout, layoutToInsert, type LayoutRow } from "./db";

describe("rowToLayout", () => {
  it("converts snake_case row fields to camelCase layout", () => {
    const row: LayoutRow = {
      id: "abc",
      user_id: "user-1",
      name: "Room 12",
      type: "traditional",
      rows: 5,
      columns: 6,
      num_groups: null,
      attendees_per_group: null,
      grid: [["seat"]],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };
    expect(rowToLayout(row)).toEqual({
      id: "abc",
      userId: "user-1",
      name: "Room 12",
      type: "traditional",
      rows: 5,
      columns: 6,
      numGroups: null,
      attendeesPerGroup: null,
      grid: [["seat"]],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });
  });

  it("preserves null dimensions for groups-type layouts", () => {
    const row: LayoutRow = {
      id: "xyz",
      user_id: "user-2",
      name: "Pods",
      type: "groups",
      rows: null,
      columns: null,
      num_groups: 4,
      attendees_per_group: 4,
      grid: [["seat"]],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };
    const layout = rowToLayout(row);
    expect(layout.rows).toBeNull();
    expect(layout.columns).toBeNull();
    expect(layout.numGroups).toBe(4);
    expect(layout.attendeesPerGroup).toBe(4);
  });
});

describe("layoutToInsert", () => {
  it("converts a NewLayout into a snake_case insert payload", () => {
    expect(
      layoutToInsert(
        {
          name: "Pod room",
          type: "groups",
          rows: null,
          columns: null,
          numGroups: 4,
          attendeesPerGroup: 4,
          grid: [["seat"]],
        },
        "user-1",
      ),
    ).toEqual({
      user_id: "user-1",
      name: "Pod room",
      type: "groups",
      rows: null,
      columns: null,
      num_groups: 4,
      attendees_per_group: 4,
      grid: [["seat"]],
      // venue_id defaults to null when the NewLayout doesn't provide one.
      // See 0009_marketplace.sql + layoutToInsert in db.ts.
      venue_id: null,
    });
  });
});
