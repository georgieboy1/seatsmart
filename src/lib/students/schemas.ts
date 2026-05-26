import { z } from "zod";
import {
  DIETARY_ACCESSIBILITY,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
  type DietaryAccessibility,
  type AntisocialTrait,
  type ProsocialTrait,
} from "./constants";

const prosocialValues = PROSOCIAL_TRAITS.map((trait) => trait.value) as [
  ProsocialTrait,
  ...ProsocialTrait[],
];
const antisocialValues = ANTISOCIAL_TRAITS.map((trait) => trait.value) as [
  AntisocialTrait,
  ...AntisocialTrait[],
];
const dietaryAccessibilityValues = DIETARY_ACCESSIBILITY.map((item) => item.value) as [
  DietaryAccessibility,
  ...DietaryAccessibility[],
];

const notesSchema = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().max(1000).nullable());

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  classId: z.string().uuid().nullable().optional(),
  externalId: z.string().trim().max(50).nullable().optional(), // ticketId?
  age: z.coerce.number().int().positive().nullable().optional(),
  familyName: z.string().trim().max(100).nullable().optional(),
  allergies: z.array(z.string()).default([]),
  healthFlags: z.array(z.string()).default([]),
  prosocialTraits: z.array(z.enum(prosocialValues)).default([]),
  antisocialTraits: z.array(z.enum(antisocialValues)).default([]),
  constraints: z.array(z.enum(dietaryAccessibilityValues)).default([]),
  togetherIds: z.array(z.string().uuid()).default([]),
  separateIds: z.array(z.string().uuid()).default([]),
  notes: notesSchema,
});

export const studentCreateSchema = studentSchema.refine(
  (student) => !student.togetherIds.some((id) => student.separateIds.includes(id)),
  {
    message: "Must-sit-together and strictly-separate list cannot contain the same student",
    path: ["separateIds"],
  },
);

export const studentUpdateSchema = studentCreateSchema;

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
