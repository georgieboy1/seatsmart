export type SeatingChart = {
  id: string;
  userId: string;
  layoutId: string;
  cohortId?: string | null;
  name: string;
  assignments: Record<string, string>;
  lockedSeats: Record<string, string>;
  score: number | null;
  seed: number;
  stale: boolean;
  staleReasons: string[];
  createdAt: string;
  updatedAt: string;
};

export type NewSeatingChart = Omit<
  SeatingChart,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
