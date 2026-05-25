import type { NewSeatingChart, SeatingChart } from "@/lib/types/chart";

export type ChartRow = {
  id: string;
  user_id: string;
  layout_id: string;
  cohort_id: string | null;
  name: string;
  assignments: Record<string, string>;
  locked_seats: Record<string, string>;
  score: number | null;
  seed: number;
  stale: boolean;
  stale_reasons: string[];
  created_at: string;
  updated_at: string;
};

export type ChartInsert = Omit<ChartRow, "id" | "created_at" | "updated_at">;

export function rowToChart(row: ChartRow): SeatingChart {
  return {
    id: row.id,
    userId: row.user_id,
    layoutId: row.layout_id,
    cohortId: row.cohort_id,
    name: row.name,
    assignments: row.assignments,
    lockedSeats: row.locked_seats ?? {},
    score: row.score,
    seed: row.seed ?? 0,
    stale: row.stale,
    staleReasons: row.stale_reasons,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function chartToInsert(chart: NewSeatingChart, userId: string): ChartInsert {
  return {
    user_id: userId,
    layout_id: chart.layoutId,
    cohort_id: chart.cohortId ?? null,
    name: chart.name,
    assignments: chart.assignments,
    locked_seats: chart.lockedSeats,
    score: chart.score,
    seed: chart.seed,
    stale: chart.stale,
    stale_reasons: chart.staleReasons,
  };
}
