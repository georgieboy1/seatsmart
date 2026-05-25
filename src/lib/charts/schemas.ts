import { z } from "zod";

export const chartUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  assignments: z.record(z.string(), z.string()).optional(),
  lockedSeats: z.record(z.string(), z.string()).optional(),
  score: z.number().nullable().optional(),
  seed: z.number().optional(),
  stale: z.boolean().optional(),
  staleReasons: z.array(z.string()).optional(),
});

export type ChartUpdate = z.infer<typeof chartUpdateSchema>;
