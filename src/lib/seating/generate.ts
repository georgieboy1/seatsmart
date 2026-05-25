import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { parsePositionKey } from "./geometry";
import { placeAccommodationStudents } from "./phase1";
import { placeRemainingStudents } from "./phase2";
import { optimizeSeatSwaps } from "./phase3";
import type { GenerationOptions, SeatingIssue, SeatingResult } from "./types";

const DEFAULT_OPTIONS: GenerationOptions = {
  honorAccommodations: true,
  respectPeerTutors: true,
  respectAvoidList: true,
  spreadAntisocialTraits: true,
  lockedSeats: {},
  seed: 0,
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function finalScore(rawRelationshipScore: number, issues: SeatingIssue[]): number {
  const issuePenalty = issues.filter((issue) => issue.severity !== "info").length * 5;
  return clampScore(100 + rawRelationshipScore - issuePenalty);
}

function mergeOptions(options: GenerationOptions): GenerationOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    lockedSeats: options.lockedSeats ?? {},
  };
}

function studentsForPhase1(
  students: Student[],
  options: GenerationOptions,
): Student[] {
  if (options.honorAccommodations) {
    return students;
  }

  return students.map((student) => ({ ...student, accommodations: [] }));
}

function avoidViolationIssues(
  students: Student[],
  assignments: Record<string, string>,
): SeatingIssue[] {
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const placed = Object.entries(assignments).map(([seatKey, studentId]) => ({
    seatKey,
    position: parsePositionKey(seatKey),
    student: studentsById.get(studentId),
  }));
  const issues: SeatingIssue[] = [];

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i].student;
      const b = placed[j].student;
      if (!a || !b) continue;

      const adjacent =
        Math.abs(placed[i].position.row - placed[j].position.row) <= 1 &&
        Math.abs(placed[i].position.column - placed[j].position.column) <= 1 &&
        placed[i].seatKey !== placed[j].seatKey;
      const avoidMatch = a.avoid.includes(b.id) || b.avoid.includes(a.id);

      if (adjacent && avoidMatch) {
        issues.push({
          severity: "warning",
          message: `${a.name} and ${b.name} are on an avoid list but sit adjacent.`,
          studentIds: [a.id, b.id],
        });
      }
    }
  }

  return issues;
}

export function generateSeating(
  students: Student[],
  classroom: ClassroomLayout,
  options: GenerationOptions,
): SeatingResult {
  const mergedOptions = mergeOptions(options);
  const phase1Started = performance.now();
  const phase1 = placeAccommodationStudents(
    studentsForPhase1(students, mergedOptions),
    classroom,
    mergedOptions.lockedSeats,
  );
  const phase1Time = performance.now() - phase1Started;

  const phase2Started = performance.now();
  const phase2 = placeRemainingStudents({
    students,
    assignments: phase1.assignments,
    placedStudentIds: phase1.placedStudentIds,
    availableSeatKeys: phase1.availableSeatKeys,
    explanations: phase1.explanations,
  });
  const phase2Time = performance.now() - phase2Started;

  const phase3 = optimizeSeatSwaps({
    students,
    assignments: phase2.assignments,
    explanations: phase2.explanations,
    lockedSeatKeys: new Set(Object.keys(mergedOptions.lockedSeats ?? {})),
    maxIterations: 100,
  });

  const issues = [
    ...phase1.issues,
    ...phase2.issues,
    ...(mergedOptions.respectAvoidList
      ? avoidViolationIssues(students, phase3.assignments)
      : []),
  ];

  return {
    assignments: phase3.assignments,
    score: finalScore(phase3.score, issues),
    issues,
    explanations: phase3.explanations,
    debug: {
      phase1Time,
      phase2Time,
      swapsAttempted: phase3.swapsAttempted,
      swapsAccepted: phase3.swapsAccepted,
    },
  };
}
