export type LockedSeat = string;

export type SeatingChart = {
  id: string;
  userId: string;
  layoutId: string;
  name: string;
  assignments: Record<string, string>;
  lockedSeats: LockedSeat[];
  score: number | null;
  stale: boolean;
  staleReasons: string[];
  createdAt: string;
  updatedAt: string;
};

export type NewSeatingChart = Omit<
  SeatingChart,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
