import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { parsePositionKey, positionKey } from "./geometry";
import { identifyAnchors, rankByTogetherCentrality } from "./anchors";
import { computePodMap } from "./distance";
import {
  isSeatFeasible,
  separationConstraints,
  type SeparationConstraint,
} from "./separation";
import { placeDietaryAccessibilityStudents } from "./phase1";
import { placeRemainingStudents } from "./phase2";
import { optimizeSeatSwaps } from "./phase3";
import type {
  GenerationOptions,
  SeatExplanation,
  SeatingIssue,
  SeatingResult,
} from "./types";

const DEFAULT_OPTIONS: GenerationOptions = {
  honorDietaryAccessibility: true,
  respectMustSitTogether: true,
  respectStrictlySeparate: true,
  spreadAntisocialTraits: true,
  lockedSeats: {},
  seed: 0,
  minDistance: 2,
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
    minDistance: options.minDistance ?? DEFAULT_OPTIONS.minDistance,
  };
}

function studentsForPhase1(
  students: Student[],
  options: GenerationOptions,
): Student[] {
  if (options.honorDietaryAccessibility) {
    return students;
  }
  return students.map((student) => ({ ...student, constraints: [] }));
}

/**
 * Phase 0 — Anchor Binding.
 *
 * Pre-bind the highest-centrality students to derived anchor seats so
 * tightly-linked social clusters cohere around natural focal points
 * (front of classroom or other teacher-defined focal points).
 *
 * Rules:
 *   - Only fires when anchor seats exist AND at least one student has
 *     non-zero together-degree. Otherwise returns no placements.
 *   - Locked seats are honored — an anchor that's already locked is
 *     skipped.
 *   - Separation constraints are respected — a student that would
 *     conflict with an already-anchored student at the proposed seat
 *     is skipped in favor of the next-most-central student.
 *   - Accommodations are NOT checked at this phase; Phase 1 placement
 *     for non-anchored students still happens normally. An anchored
 *     student with accommodations may end up sub-optimally placed —
 *     this is an accepted v0 trade-off and is surfaced via explanation.
 */
function bindAnchors(
  students: Student[],
  layout: ClassroomLayout,
  lockedSeats: Record<string, string>,
  constraints: SeparationConstraint[],
  podMap: Map<string, number>,
): {
  assignments: Record<string, string>;
  explanations: Record<string, SeatExplanation[]>;
  bound: number;
} {
  const assignments: Record<string, string> = {};
  const explanations: Record<string, SeatExplanation[]> = {};

  const anchors = identifyAnchors(layout);
  if (anchors.length === 0) {
    return { assignments, explanations, bound: 0 };
  }

  const ranked = rankByTogetherCentrality(students);
  if (ranked.length === 0) {
    return { assignments, explanations, bound: 0 };
  }

  const lockedKeys = new Set(Object.keys(lockedSeats));
  const lockedStudentIds = new Set(Object.values(lockedSeats));
  const placedStudentIds = new Set<string>(lockedStudentIds);

  for (const anchorPos of anchors) {
    const seatKey = positionKey(anchorPos);
    if (lockedKeys.has(seatKey)) continue;
    if (assignments[seatKey]) continue;

    // Find the highest-centrality student who hasn't been placed yet
    // AND who wouldn't violate a separation constraint at this seat.
    const candidate = ranked.find((entry) => {
      if (placedStudentIds.has(entry.student.id)) return false;
      // Build a combined view (locked + already-bound) to feasibility-check against
      const combined = { ...lockedSeats, ...assignments };
      return isSeatFeasible(
        seatKey,
        entry.student.id,
        combined,
        constraints,
        layout,
        podMap,
      );
    });

    if (!candidate) break; // no more eligible high-centrality students

    assignments[seatKey] = candidate.student.id;
    placedStudentIds.add(candidate.student.id);
    explanations[seatKey] = [
      {
        rule: "anchor_proximity",
        weight: 15,
        reason: `${candidate.student.name} is at an anchor seat: highest social centrality with ${candidate.centrality} together-link${candidate.centrality === 1 ? "" : "s"} in this roster.`,
      },
    ];
  }

  return { assignments, explanations, bound: Object.keys(assignments).length };
}

function strictlySeparateViolationIssues(
  students: Student[],
  assignments: Record<string, string>,
  respect: boolean,
): SeatingIssue[] {
  // After phase 3, surface any *adjacency* of separate-list pairs as
  // warnings. Hard min-distance violations are already surfaced as
  // errors during placement; this catches the legacy soft-adjacency
  // warning UI consumers expect.
  if (!respect) return [];

  const studentsById = new Map(students.map((a) => [a.id, a]));
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
      const separateMatch =
        a.separateIds.includes(b.id) || b.separateIds.includes(a.id);

      if (adjacent && separateMatch) {
        issues.push({
          severity: "warning",
          message: `${a.name} and ${b.name} are on a separate-list but sit adjacent.`,
          externalIds: [a.id, b.id],
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

  // Pre-compute geometry + constraint set
  const podMap = computePodMap(classroom);
  const constraints = mergedOptions.respectStrictlySeparate
    ? separationConstraints(students, mergedOptions.minDistance ?? 2)
    : [];

  // Phase 0 — Anchor binding
  const phase0Started = performance.now();
  const phase0 = bindAnchors(
    students,
    classroom,
    mergedOptions.lockedSeats ?? {},
    constraints,
    podMap,
  );
  const phase0Time = performance.now() - phase0Started;

  // Phase 1 — Accommodation placement.
  // Anchor placements are passed through as if they were locked, so
  // phase 1 doesn't try to place those students elsewhere.
  const phase1Started = performance.now();
  const phase1LockedSeats = {
    ...(mergedOptions.lockedSeats ?? {}),
    ...phase0.assignments,
  };
  const phase1 = placeDietaryAccessibilityStudents(
    studentsForPhase1(students, mergedOptions),
    classroom,
    phase1LockedSeats,
    constraints,
    podMap,
  );
  // Merge phase 0 explanations into phase 1's seat map
  const mergedPhase1Explanations: Record<string, SeatExplanation[]> = {
    ...phase1.explanations,
  };
  for (const [seatKey, items] of Object.entries(phase0.explanations)) {
    mergedPhase1Explanations[seatKey] = [
      ...(mergedPhase1Explanations[seatKey] ?? []),
      ...items,
    ];
  }
  const phase1Time = performance.now() - phase1Started;

  // Phase 2 — Place remaining students with relationship scoring
  const phase2Started = performance.now();
  const phase2 = placeRemainingStudents({
    students,
    assignments: phase1.assignments,
    placedStudentIds: phase1.placedStudentIds,
    availableSeatKeys: phase1.availableSeatKeys,
    explanations: mergedPhase1Explanations,
    layout: classroom,
    podMap,
    constraints,
  });
  const phase2Time = performance.now() - phase2Started;

  // Phase 3 — Local optimization via seat swaps
  const phase3 = optimizeSeatSwaps({
    students,
    assignments: phase2.assignments,
    explanations: phase2.explanations,
    lockedSeatKeys: new Set([
      ...Object.keys(mergedOptions.lockedSeats ?? {}),
      ...Object.keys(phase0.assignments),
    ]),
    maxIterations: 100,
    layout: classroom,
    podMap,
    constraints,
  });

  const issues: SeatingIssue[] = [
    ...phase1.issues,
    ...phase2.issues,
    ...strictlySeparateViolationIssues(
      students,
      phase3.assignments,
      mergedOptions.respectStrictlySeparate,
    ),
  ];

  return {
    assignments: phase3.assignments,
    score: finalScore(phase3.score, issues),
    issues,
    explanationsBySeat: phase3.explanations,
    debug: {
      phase0Time,
      phase1Time,
      phase2Time,
      swapsAttempted: phase3.swapsAttempted,
      swapsAccepted: phase3.swapsAccepted,
      anchorsBound: phase0.bound,
    },
  };
}
