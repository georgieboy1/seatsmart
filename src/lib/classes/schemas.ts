import { z } from "zod";

export const classCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const classUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});
