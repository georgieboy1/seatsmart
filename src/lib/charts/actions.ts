import * as db from "@/lib/local/store";
import { go } from "@/lib/local/nav";
import { chartToInsert, rowToChart, type ChartRow } from "./db";
import type { NewSeatingChart, SeatingChart } from "@/lib/types/chart";
import { chartUpdateSchema } from "./schemas";

export function chartHref(id: string) {
  return `/charts/view?id=${encodeURIComponent(id)}`;
}

export async function createChart(chart: NewSeatingChart): Promise<string> {
  const [row] = db.insert("seating_charts", [chartToInsert(chart, db.LOCAL_USER_ID)]);
  return row.id;
}

export async function updateChart(id: string, payload: Partial<NewSeatingChart>) {
  const result = chartUpdateSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid chart data: ${result.error.issues[0]?.message}`);
  }
  if (!db.find("seating_charts", id)) {
    throw new Error("Failed to update chart: it no longer exists on this device.");
  }

  const d = result.data;
  const patch: Partial<ChartRow> = {};
  if (d.name !== undefined) patch.name = d.name;
  if (d.assignments !== undefined) patch.assignments = d.assignments;
  if (d.lockedSeats !== undefined) patch.locked_seats = d.lockedSeats;
  if (d.score !== undefined) patch.score = d.score;
  if (d.seed !== undefined) patch.seed = d.seed;
  if (d.stale !== undefined) patch.stale = d.stale;
  if (d.staleReasons !== undefined) patch.stale_reasons = d.staleReasons;

  db.update("seating_charts", [id], patch);
}

export async function deleteChart(id: string) {
  db.remove("seating_charts", [id]);
  go("/charts");
}

export async function listCharts(): Promise<SeatingChart[]> {
  return db
    .all("seating_charts")
    .map(rowToChart)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getChart(id: string): Promise<SeatingChart | null> {
  const row = db.find("seating_charts", id);
  return row ? rowToChart(row) : null;
}
