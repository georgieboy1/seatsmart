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
};

export type SeatingIssue = {
  severity: "info" | "warning" | "error";
  message: string;
  externalIds?: string[]; // attendeeIds?
  position?: SeatPosition;
};

export type SeatExplanation = {
  rule: string;
  weight: number;
  reason: string;
};

export type SeatingResult = {
  assignments: Record<string, string>;
  score: number;
  issues: SeatingIssue[];
  explanations: Record<string, SeatExplanation[]>;
  debug: {
    phase1Time: number;
    phase2Time: number;
    swapsAttempted: number;
    swapsAccepted: number;
  };
};

export type SeatCandidate = {
  position: SeatPosition;
  key: string;
  cellType: CellType;
  layout: ClassroomLayout;
  attendee?: Attendee;
};
