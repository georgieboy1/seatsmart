import type { Student } from "@/lib/types/student";
import { parsePositionKey } from "./geometry";
import { scoreRelationshipPair } from "./scoring";
import type { SeatExplanation, SeatingIssue } from "./types";

export type Phase2Input = {
  students: Student[];
  assignments: Record<string, string>;
  placedStudentIds: Set<string>;
  availableSeatKeys: string[];
  explanations: Record<string, SeatExplanation[]>;
};

export type Phase2Result = Phase2Input & {
  issues: SeatingIssue[];
};

type PlacementScore = {
  student: Student;
  seatKey: string;
  score: number;
  explanations: SeatExplanation[];
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

  return { student, seatKey, score, explanations };
}

export function placeRemainingStudents(input: Phase2Input): Phase2Result {
  const assignments = { ...input.assignments };
  const placedStudentIds = new Set(input.placedStudentIds);
  const availableSeatKeys = [...input.availableSeatKeys].toSorted();
  const explanations = { ...input.explanations };
  const issues: SeatingIssue[] = [];
  const studentsById = new Map(input.students.map((student) => [student.id, student]));
  const remaining = remainingStudents(input.students, placedStudentIds);

  while (remaining.length > 0 && availableSeatKeys.length > 0) {
    const ranked: PlacementScore[] = [];

    for (const student of remaining) {
      for (const seatKey of availableSeatKeys) {
        ranked.push(scorePlacement(student, seatKey, studentsById, assignments));
      }
    }

    ranked.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      const nameDiff = a.student.name.localeCompare(b.student.name);
      if (nameDiff !== 0) return nameDiff;

      return a.seatKey.localeCompare(b.seatKey);
    });

    const best = ranked[0];
    assignments[best.seatKey] = best.student.id;
    placedStudentIds.add(best.student.id);
    explanations[best.seatKey] = best.explanations;

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
      studentIds: [student.id],
    });
  }

  return {
    students: input.students,
    assignments,
    placedStudentIds,
    availableSeatKeys,
    issues,
    explanations,
  };
}
