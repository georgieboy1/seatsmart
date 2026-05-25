import { z } from "zod";

export const cohortCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const cohortUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});
