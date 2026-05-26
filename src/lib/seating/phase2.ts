import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { parsePositionKey } from "./geometry";
import { scoreRelationshipPair } from "./scoring";
import {
  countViolations,
  isSeatFeasible,
  violatingPartners,
  type SeparationConstraint,
} from "./separation";
import type { SeatExplanation, SeatingIssue } from "./types";

export type Phase2Input = {
  students: Student[];
  assignments: Record<string, string>;
  placedStudentIds: Set<string>;
  availableSeatKeys: string[];
  explanations: Record<string, SeatExplanation[]>;
  /** Layout + podMap + constraints are optional for callers that don't enforce separation. */
  layout?: ClassroomLayout;
  podMap?: Map<string, number>;
  constraints?: SeparationConstraint[];
};

export type Phase2Result = Phase2Input & {
  issues: SeatingIssue[];
};

type PlacementScore = {
  student: Student;
  seatKey: string;
  score: number;
  explanations: SeatExplanation[];
  feasible: boolean;
  violations: number;
};

function remainingStudents(students: Student[], placedStudentIds: Set<string>) {
  return students
    .filter((student) => !placedStudentIds.has(student.id))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

function scorePlacement(
  student: Student,
  seatKey: string,
  studentsById: Map<string, Student>,
  assignments: Record<string, string>,
  layout: ClassroomLayout | undefined,
  podMap: Map<string, number>,
  constraints: SeparationConstraint[],
): PlacementScore {
  const seatPosition = parsePositionKey(seatKey);
  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (const [placedSeatKey, placedStudentId] of Object.entries(assignments)) {
    const placedStudent = studentsById.get(placedStudentId);
    if (!placedStudent) continue;

    const pairScore = scoreRelationshipPair(
      student,
      seatPosition,
      placedStudent,
      parsePositionKey(placedSeatKey),
    );
    score += pairScore.score;
    explanations.push(...pairScore.explanations);
  }

  const feasible = layout
    ? isSeatFeasible(
        seatKey,
        student.id,
        assignments,
        constraints,
        layout,
        podMap,
      )
    : true;

  const violations = layout && !feasible
    ? countViolations(
        seatKey,
        student.id,
        assignments,
        constraints,
        layout,
        podMap,
      )
    : 0;

  return { student, seatKey, score, explanations, feasible, violations };
}

export function placeRemainingStudents(input: Phase2Input): Phase2Result {
  const assignments = { ...input.assignments };
  const placedStudentIds = new Set(input.placedStudentIds);
  const availableSeatKeys = [...input.availableSeatKeys].toSorted();
  const explanations = { ...input.explanations };
  const issues: SeatingIssue[] = [];
  const studentsById = new Map(input.students.map((a) => [a.id, a]));
  const remaining = remainingStudents(input.students, placedStudentIds);
  const layout = input.layout;
  const podMap = input.podMap ?? new Map<string, number>();
  const constraints = input.constraints ?? [];
  const minDistance = constraints[0]?.minDistance ?? 2;

  while (remaining.length > 0 && availableSeatKeys.length > 0) {
    const ranked: PlacementScore[] = [];

    for (const student of remaining) {
      for (const seatKey of availableSeatKeys) {
        ranked.push(
          scorePlacement(
            student,
            seatKey,
            studentsById,
            assignments,
            layout,
            podMap,
            constraints,
          ),
        );
      }
    }

    // Sort: feasible first, then by violation count asc (matters only
    // when ALL options are infeasible for some student), then by score
    // desc, then by name, then by seat key.
    ranked.sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      if (!a.feasible && !b.feasible && a.violations !== b.violations) {
        return a.violations - b.violations;
      }
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const nameDiff = a.student.name.localeCompare(b.student.name);
      if (nameDiff !== 0) return nameDiff;
      return a.seatKey.localeCompare(b.seatKey);
    });

    const best = ranked[0];
    assignments[best.seatKey] = best.student.id;
    placedStudentIds.add(best.student.id);

    const seatExplanations: SeatExplanation[] = [...best.explanations];

    if (!best.feasible && layout) {
      const partners = violatingPartners(
        best.seatKey,
        best.student.id,
        assignments,
        studentsById,
        constraints,
        layout,
        podMap,
      );
      const partnerNames =
        partners.map((p) => p.name).join(", ") || "another conflicted student";
      seatExplanations.push({
        rule: "min_distance_violated",
        weight: -50,
        reason: `${best.student.name} could not be separated from ${partnerNames} — no seat in this room satisfies the ≥${minDistance} minimum.`,
      });
      issues.push({
        severity: "error",
        message: `${best.student.name} must be ≥${minDistance} seats apart from ${partnerNames} but the room is too small.`,
        externalIds: [best.student.id, ...partners.map((p) => p.id)],
      });
    }

    explanations[best.seatKey] = seatExplanations;

    remaining.splice(
      remaining.findIndex((student) => student.id === best.student.id),
      1,
    );
    availableSeatKeys.splice(
      availableSeatKeys.findIndex((seatKey) => seatKey === best.seatKey),
      1,
    );
  }

  for (const student of remaining) {
    issues.push({
      severity: "warning",
      message: `No available seat for ${student.name}.`,
      externalIds: [student.id],
    });
  }

  return {
    students: input.students,
    assignments,
    placedStudentIds,
    availableSeatKeys,
    issues,
    explanations,
    layout,
    podMap,
    constraints,
  };
}
