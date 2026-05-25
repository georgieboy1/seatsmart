/**
 * A physical venue with capacity / compliance limits.
 *
 * Compliance fields are optional because not every venue has the same
 * regulatory regime. Treat null as "unknown / not enforced" and surface
 * that to the user in the UI.
 */
export type Venue = {
  id: string;
  userId: string;
  name: string;
  address: string | null;
  /** Maximum occupants per local fire code. Null = unknown. */
  fireCodeCapacity: number | null;
  /** Minimum number of accessible seats required at this venue. */
  adaRequiredSeats: number;
  /** Banquet/catering per-table cap, if applicable. Null = no cap. */
  maxPerTable: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewVenue = Omit<
  Venue,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
