export type CellType =
  | "door"
  | "window"
  | "teacher_desk"
  | "whiteboard"
  | "charging_station"
  | "perimeter"
  | "seat"
  | "empty";

export type LayoutType = "traditional" | "groups";

export type ClassroomLayout = {
  id: string;
  userId: string;
  name: string;
  type: LayoutType;
  rows: number | null;
  columns: number | null;
  numGroups: number | null;
  attendeesPerGroup: number | null;
  grid: CellType[][];
  /**
   * Optional reference to a Venue (see 0009_marketplace.sql).
   * Deleting a venue sets this to null rather than destroying the layout.
   */
  venueId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Write-shape for inserting a new layout. venueId is OPTIONAL here
 * (callers may not have one — the layout builder doesn't currently ask),
 * but the read-shape ClassroomLayout always has it present. The DB
 * column is nullable; layoutToInsert defaults missing values to null.
 */
export type NewLayout = Omit<
  ClassroomLayout,
  "id" | "userId" | "createdAt" | "updatedAt" | "venueId"
> & {
  venueId?: string | null;
};

// Cell types that can appear on the perimeter (clickable to cycle through
// in the layout builder). Order here defines the cycle order.
export const PERIMETER_CYCLE: CellType[] = [
  "perimeter",
  "door",
  "window",
  "teacher_desk",
  "whiteboard",
  "charging_station",
];

// Cell types that can appear in the interior (toggle between these two).
export const INTERIOR_TOGGLE: CellType[] = ["seat", "empty"];
