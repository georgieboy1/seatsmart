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
  studentsPerGroup: number | null;
  grid: CellType[][];
  createdAt: string;
  updatedAt: string;
};

export type NewLayout = Omit<
  ClassroomLayout,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

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
