import { describe, expect, it } from "vitest";
import { chartToInsert, rowToChart, type ChartRow } from "./db";

const row: ChartRow = {
  id: "chart-1",
  user_id: "user-1",
  layout_id: "layout-1",
  cohort_id: "cohort-1",
  name: "Monday chart",
  assignments: {
    "1,1": "attendee-1",
    "1,2": "attendee-2",
  },
  locked_seats: { "1,1": "attendee-1" },
  score: 87,
  seed: 123,
  stale: true,
  stale_reasons: ["layout resized", "attendee removed: Maya"],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("chart db mappers", () => {
  it("maps a Supabase row to a SeatingChart", () => {
    expect(rowToChart(row)).toEqual({
      id: "chart-1",
      userId: "user-1",
      layoutId: "layout-1",
      cohortId: "cohort-1",
      name: "Monday chart",
      assignments: {
        "1,1": "attendee-1",
        "1,2": "attendee-2",
      },
      lockedSeats: { "1,1": "attendee-1" },
      score: 87,
      seed: 123,
      stale: true,
      staleReasons: ["layout resized", "attendee removed: Maya"],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a NewSeatingChart to a Supabase insert shape", () => {
    expect(
      chartToInsert(
        {
          layoutId: "layout-1",
          cohortId: null,
          name: "Monday chart",
          assignments: {
            "1,1": "attendee-1",
          },
          lockedSeats: { "1,1": "attendee-1" },
          score: 92,
          seed: 456,
          stale: false,
          staleReasons: [],
        },
        "user-1",
      ),
    ).toEqual({
      user_id: "user-1",
      layout_id: "layout-1",
      cohort_id: null,
      name: "Monday chart",
      assignments: {
        "1,1": "attendee-1",
      },
      locked_seats: { "1,1": "attendee-1" },
      score: 92,
      seed: 456,
      stale: false,
      stale_reasons: [],
    });
  });

  it("preserves stale flags and reasons", () => {
    const chart = rowToChart(row);

    expect(chart.stale).toBe(true);
    expect(chart.staleReasons).toEqual([
      "layout resized",
      "attendee removed: Maya",
    ]);
  });

  it("preserves locked seat records", () => {
    expect(rowToChart(row).lockedSeats).toEqual({ "1,1": "attendee-1" });
  });

  it("allows charts with no cohort association", () => {
    expect(rowToChart({ ...row, cohort_id: null }).cohortId).toBeNull();
  });
});
