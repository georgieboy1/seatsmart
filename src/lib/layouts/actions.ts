import * as db from "@/lib/local/store";
import { go, withMessage } from "@/lib/local/nav";
import { layoutCreateSchema, layoutUpdateSchema } from "./schemas";
import { rowToLayout, layoutToInsert } from "./db";
import { createTraditionalGrid } from "./grid";
import type { ClassroomLayout } from "@/lib/types/layout";

const LAYOUT_UPDATED = "layout was updated";

export function layoutHref(id: string) {
  return `/layouts/edit?id=${encodeURIComponent(id)}`;
}

function parseFormData(formData: FormData) {
  const type = formData.get("type");
  const isTraditional = type === "traditional";

  const num = (key: string): number | null => {
    const val = formData.get(key);
    if (val == null || val === "") return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  let grid: unknown = [];
  try {
    grid = JSON.parse(String(formData.get("grid") ?? "[]"));
  } catch {
    grid = [];
  }

  return {
    name: String(formData.get("name") ?? ""),
    type,
    rows: isTraditional ? num("rows") : null,
    columns: isTraditional ? num("columns") : null,
    numGroups: !isTraditional ? num("numGroups") : null,
    studentsPerGroup: !isTraditional ? num("studentsPerGroup") : null,
    grid,
    frontWall: formData.get("frontWall") || null,
  };
}

export async function createDefaultLayout() {
  const [row] = db.insert("layouts", [
    layoutToInsert(
      {
        name: "Untitled layout",
        type: "traditional",
        rows: 5,
        columns: 6,
        numGroups: null,
        studentsPerGroup: null,
        grid: createTraditionalGrid(5, 6),
      },
      db.LOCAL_USER_ID,
    ),
  ]);
  go(layoutHref(row.id));
}

export async function createLayout(formData: FormData) {
  const result = layoutCreateSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    go(withMessage("/layouts", "error", result.error.issues[0]?.message ?? "Invalid layout"));
    return;
  }
  const [row] = db.insert("layouts", [layoutToInsert(result.data, db.LOCAL_USER_ID)]);
  go(layoutHref(row.id));
}

export async function listLayouts(): Promise<ClassroomLayout[]> {
  return db
    .all("layouts")
    .map(rowToLayout)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLayout(id: string): Promise<ClassroomLayout | null> {
  const row = db.find("layouts", id);
  return row ? rowToLayout(row) : null;
}

export async function updateLayout(id: string, formData: FormData) {
  const result = layoutUpdateSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    go(withMessage(layoutHref(id), "error", result.error.issues[0]?.message ?? "Invalid layout"));
    return;
  }
  const l = result.data;
  db.update("layouts", [id], {
    name: l.name,
    type: l.type,
    rows: l.rows,
    columns: l.columns,
    num_groups: l.numGroups,
    students_per_group: l.studentsPerGroup,
    grid: l.grid,
    front_wall: l.frontWall,
  });

  const charts = db
    .all("seating_charts")
    .filter((chart) => chart.layout_id === id)
    .map((chart) => chart.id);
  if (charts.length > 0) {
    db.update("seating_charts", charts, (chart) => ({
      stale: true,
      stale_reasons: Array.from(new Set([...chart.stale_reasons, LAYOUT_UPDATED])),
    }));
  }
}

export async function duplicateLayout(id: string) {
  const source = db.find("layouts", id);
  if (!source) {
    go(withMessage("/layouts", "error", "Source layout not found"));
    return;
  }
  const layout = rowToLayout(source);
  const [row] = db.insert("layouts", [
    layoutToInsert(
      {
        name: `${layout.name} (copy)`,
        type: layout.type,
        rows: layout.rows,
        columns: layout.columns,
        numGroups: layout.numGroups,
        studentsPerGroup: layout.studentsPerGroup,
        grid: layout.grid,
        frontWall: layout.frontWall,
      },
      db.LOCAL_USER_ID,
    ),
  ]);
  go(layoutHref(row.id));
}

/**
 * Lightweight rename used by the kebab menu on /layouts cards. Only the
 * name changes, so charts are not flagged stale.
 */
export async function renameLayout(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    go(withMessage("/layouts", "error", "Name is required"));
    return;
  }
  if (name.length > 100) {
    go(withMessage("/layouts", "error", "Name is too long"));
    return;
  }
  db.update("layouts", [id], { name });
}

export async function deleteLayout(id: string) {
  const count = db.all("seating_charts").filter((chart) => chart.layout_id === id).length;
  if (count > 0) {
    go(
      withMessage(
        "/layouts",
        "error",
        `This layout is used by ${count} chart${count === 1 ? "" : "s"}. Delete or duplicate them first.`,
      ),
    );
    return;
  }
  db.remove("layouts", [id]);
  go("/layouts");
}
