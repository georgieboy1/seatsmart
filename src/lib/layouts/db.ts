import type {
  CellType,
  ClassroomLayout,
  LayoutType,
  NewLayout,
} from "@/lib/types/layout";

export type LayoutRow = {
  id: string;
  user_id: string;
  name: string;
  type: LayoutType;
  rows: number | null;
  columns: number | null;
  num_groups: number | null;
  attendees_per_group: number | null;
  grid: CellType[][];
  venue_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LayoutInsert = Omit<LayoutRow, "id" | "created_at" | "updated_at">;

export function rowToLayout(row: LayoutRow): ClassroomLayout {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    rows: row.rows,
    columns: row.columns,
    numGroups: row.num_groups,
    attendeesPerGroup: row.attendees_per_group,
    grid: row.grid,
    venueId: row.venue_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function layoutToInsert(
  layout: NewLayout,
  userId: string,
): LayoutInsert {
  return {
    user_id: userId,
    name: layout.name,
    type: layout.type,
    rows: layout.rows,
    columns: layout.columns,
    num_groups: layout.numGroups,
    attendees_per_group: layout.attendeesPerGroup,
    grid: layout.grid,
    venue_id: layout.venueId ?? null,
  };
}
