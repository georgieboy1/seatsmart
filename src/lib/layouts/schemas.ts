import { z } from "zod";

const cellTypeSchema = z.enum([
  "door",
  "window",
  "teacher_desk",
  "whiteboard",
  "charging_station",
  "perimeter",
  "seat",
  "empty",
]);

const gridSchema = z
  .array(z.array(cellTypeSchema))
  .min(1, "Grid must have at least one row")
  .refine(
    (rows) => rows.every((row) => row.length === rows[0].length),
    { message: "All grid rows must have the same length" },
  );

const nameField = z.string().trim().min(1, "Name is required").max(100);

const traditionalSchema = z.object({
  name: nameField,
  type: z.literal("traditional"),
  rows: z.number().int().min(1).max(10),
  columns: z.number().int().min(1).max(10),
  numGroups: z.null(),
  studentsPerGroup: z.null(),
  grid: gridSchema,
});

const groupsSchema = z.object({
  name: nameField,
  type: z.literal("groups"),
  rows: z.null(),
  columns: z.null(),
  numGroups: z.number().int().min(1).max(12),
  studentsPerGroup: z.number().int().min(1).max(8),
  grid: gridSchema,
});

export const layoutCreateSchema = z.discriminatedUnion("type", [
  traditionalSchema,
  groupsSchema,
]);

export type LayoutCreateInput = z.infer<typeof layoutCreateSchema>;

// Update accepts the same shape as create. The id is passed
// separately (URL param), not via the schema.
export const layoutUpdateSchema = layoutCreateSchema;
export type LayoutUpdateInput = z.infer<typeof layoutUpdateSchema>;
