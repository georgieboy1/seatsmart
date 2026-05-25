import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { getSeatCandidates, positionKey } from "./geometry";
import { scoreAccommodationFit } from "./scoring";
import type { SeatExplanation, SeatingIssue } from "./types";

export type Phase1Result = {
  assignments: Record<string, string>;
  placedStudentIds: Set<string>;
  availableSeatKeys: string[];
  issues: SeatingIssue[];
  explanations: Record<string, SeatExplanation[]>;
};

function constrainedStudents(students: Student[]): Student[] {
  return students
    .filter((student) => student.accommodations.length > 0)
    .toSorted((a, b) => {
      const accommodationDiff = b.accommodations.length - a.accommodations.length;
      if (accommodationDiff !== 0) return accommodationDiff;
      return a.name.localeCompare(b.name);
    });
}

export function placeAccommodationStudents(
  students: Student[],
  layout: ClassroomLayout,
  lockedSeats: Record<string, string> = {},
): Phase1Result {
  const candidates = getSeatCandidates(layout);
  const candidateKeys = new Set(candidates.map((candidate) => candidate.key));
  const assignments: Record<string, string> = {};
  const explanations: Record<string, SeatExplanation[]> = {};
  const issues: SeatingIssue[] = [];
  const placedStudentIds = new Set<string>();

  for (const [seatKey, studentId] of Object.entries(lockedSeats)) {
    if (!candidateKeys.has(seatKey)) {
      issues.push({
        severity: "warning",
        message: `Locked seat ${seatKey} is not an assignable seat and was ignored.`,
        studentIds: [studentId],
      });
      continue;
    }

    assignments[seatKey] = studentId;
    explanations[seatKey] = [];
    placedStudentIds.add(studentId);
  }

  const available = candidates.filter((candidate) => !assignments[candidate.key]);

  for (const student of constrainedStudents(students)) {
    if (placedStudentIds.has(student.id)) {
      continue;
    }

    if (available.length === 0) {
      issues.push({
        severity: "warning",
        message: `No available seat for ${student.name}'s accommodations.`,
        studentIds: [student.id],
      });
      continue;
    }

    const ranked = available
      .map((candidate) => {
        const fit = scoreAccommodationFit(student, layout, candidate.position);
        return { candidate, ...fit };
      })
      .toSorted((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.candidate.key.localeCompare(b.candidate.key);
      });

    const best = ranked[0];
    assignments[best.candidate.key] = student.id;
    explanations[best.candidate.key] = best.explanations;
    placedStudentIds.add(student.id);
    available.splice(
      available.findIndex((candidate) => candidate.key === best.candidate.key),
      1,
    );

    if (best.score < 0) {
      issues.push({
        severity: "warning",
        message: `${student.name}'s accommodations could not be fully satisfied.`,
        studentIds: [student.id],
        position: best.candidate.position,
      });
    }
  }

  return {
    assignments,
    placedStudentIds,
    availableSeatKeys: available.map((candidate) =>
      positionKey(candidate.position),
    ),
    issues,
    explanations,
  };
}
