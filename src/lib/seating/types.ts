import type { CellType, ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";

export type SeatPosition = {
  row: number;
  column: number;
};

export type SeatAssignment = {
  position: SeatPosition;
  studentId: string;
};

export type GenerationOptions = {
  honorAccommodations: boolean;
  respectPeerTutors: boolean;
  respectAvoidList: boolean;
  spreadAntisocialTraits: boolean;
  lockedSeats?: Record<string, string>;
  seed?: number;
};

export type SeatingIssue = {
  severity: "info" | "warning" | "error";
  message: string;
  studentIds?: string[];
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
  student?: Student;
};
