import type { CellType, ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";

export type SeatPosition = {
  row: number;
  column: number;
};

export type SeatAssignment = {
  position: SeatPosition;
  externalId: string; // attendeeId? I'll keep externalId in assignments for now or rename if destructive check.
};

export type GenerationOptions = {
  honorDietaryAccessibility: boolean;
  respectMustSitTogether: boolean;
  respectStrictlySeparate: boolean;
  spreadAntisocialTraits: boolean;
  lockedSeats?: Record<string, string>;
  seed?: number;
  /**
   * Minimum Chebyshev distance between two attendees on a separate-list.
   * Default 2 (i.e., not within the 8-neighbor ring). For Groups
   * layouts, "different pod" satisfies the constraint regardless of
   * physical distance — banquet tables are hard social barriers.
   */
  minDistance?: number;
};

/**
 * A pre-bound placement chosen in Phase 0 (anchor binding).
 * Top-centrality attendees are bound to anchor seats before
 * accommodation-based placement runs.
 */
export type AnchorPlacement = {
  seatKey: string;
  attendeeId: string;
  centrality: number;
};

export type SeatingIssue = {
  severity: "info" | "warning" | "error";
  message: string;
  externalIds?: string[]; // attendeeIds?
  position?: SeatPosition;
};

/**
 * The literal-union "rule" identifies why this explanation entry exists.
 * Phase 0 (anchor) contributes `anchor_proximity`.
 * Phase 1 (constraints) contributes constraint-name rules (e.g. `near_door`).
 * Phase 2/3 contribute relationship rules (e.g. `together_list_adjacency`).
 * Separation enforcement contributes `min_distance_kept` (when a seat was
 * chosen further from a conflicted attendee than it could have been) and
 * `min_distance_violated` (when no feasible seat existed).
 */
export type ExplanationRule =
  | "anchor_proximity"
  | "min_distance_kept"
  | "min_distance_violated"
  | string;

export type SeatExplanation = {
  rule: ExplanationRule;
  weight: number;
  reason: string;
};

export type SeatingResult = {
  assignments: Record<string, string>;
  score: number;
  issues: SeatingIssue[];
  /**
   * Map seat_key → ordered list of placement explanations for that seat.
   * The frontend tooltip consumes this directly; do not derive UI text
   * from anywhere else.
   */
  explanationsBySeat: Record<string, SeatExplanation[]>;
  debug: {
    phase0Time: number;
    phase1Time: number;
    phase2Time: number;
    swapsAttempted: number;
    swapsAccepted: number;
    anchorsBound: number;
  };
};

export type SeatCandidate = {
  position: SeatPosition;
  key: string;
  cellType: CellType;
  layout: ClassroomLayout;
  attendee?: Attendee;
};
