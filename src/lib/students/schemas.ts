import { z } from "zod";
import {
  ACCOMMODATIONS,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
  type Accommodation,
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
const accommodationValues = ACCOMMODATIONS.map((item) => item.value) as [
  Accommodation,
  ...Accommodation[],
];

const notesSchema = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().max(1000).nullable());

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  prosocialTraits: z.array(z.enum(prosocialValues)).default([]),
  antisocialTraits: z.array(z.enum(antisocialValues)).default([]),
  accommodations: z.array(z.enum(accommodationValues)).default([]),
  peerTutors: z.array(z.string().uuid()).default([]),
  avoid: z.array(z.string().uuid()).default([]),
  notes: notesSchema,
});

export const studentCreateSchema = studentSchema.refine(
  (student) => !student.peerTutors.some((id) => student.avoid.includes(id)),
  {
    message: "Peer tutors and avoid list cannot contain the same student",
    path: ["avoid"],
  },
);

// Update accepts the same editable fields as create. The id comes
// from the route/button action, so it does not belong in the schema.
export const studentUpdateSchema = studentCreateSchema;

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
