import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { explainAssignments, scoreSeatingRelationships } from "./scoring";
import {
  checkSeparation,
  type SeparationConstraint,
} from "./separation";
import type { SeatExplanation } from "./types";

export type Phase3Input = {
  attendees: Attendee[];
  assignments: Record<string, string>;
  explanations: Record<string, SeatExplanation[]>;
  lockedSeatKeys?: Set<string>;
  maxIterations?: number;
  /** When provided, swaps that introduce NEW separation violations are rejected. */
  layout?: ClassroomLayout;
  podMap?: Map<string, number>;
  constraints?: SeparationConstraint[];
};

export type Phase3Result = {
  assignments: Record<string, string>;
  explanations: Record<string, SeatExplanation[]>;
  swapsAttempted: number;
  swapsAccepted: number;
  swapsRejectedForSeparation: number;
  score: number;
};

function swapAssignments(
  assignments: Record<string, string>,
  a: string,
  b: string,
): Record<string, string> {
  return {
    ...assignments,
    [a]: assignments[b],
    [b]: assignments[a],
  };
}

export function optimizeSeatSwaps(input: Phase3Input): Phase3Result {
  let assignments = { ...input.assignments };
  let score = scoreSeatingRelationships(input.attendees, assignments).score;
  let swapsAttempted = 0;
  let swapsAccepted = 0;
  let swapsRejectedForSeparation = 0;
  const maxIterations = input.maxIterations ?? 100;
  const lockedSeatKeys = input.lockedSeatKeys ?? new Set<string>();
  const layout = input.layout;
  const podMap = input.podMap ?? new Map<string, number>();
  const constraints = input.constraints ?? [];

  const swappableSeatKeys = Object.keys(assignments)
    .filter((seatKey) => !lockedSeatKeys.has(seatKey))
    .toSorted();

  let currentViolations = layout
    ? checkSeparation(assignments, constraints, layout, podMap).length
    : 0;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let bestAssignments = assignments;
    let bestScore = score;
    let bestViolations = currentViolations;
    let improved = false;

    for (let i = 0; i < swappableSeatKeys.length; i += 1) {
      for (let j = i + 1; j < swappableSeatKeys.length; j += 1) {
        swapsAttempted += 1;

        const candidate = swapAssignments(
          assignments,
          swappableSeatKeys[i],
          swappableSeatKeys[j],
        );

        // Separation gate: reject swaps that introduce NEW violations.
        // Swaps that reduce violations OR keep them constant proceed to
        // the score comparison.
        if (layout && constraints.length > 0) {
          const candidateViolations = checkSeparation(
            candidate,
            constraints,
            layout,
            podMap,
          ).length;
          if (candidateViolations > currentViolations) {
            swapsRejectedForSeparation += 1;
            continue;
          }
          // Prefer swaps that strictly reduce violations even at lower score.
          if (candidateViolations < bestViolations) {
            bestAssignments = candidate;
            bestScore = scoreSeatingRelationships(input.attendees, candidate).score;
            bestViolations = candidateViolations;
            improved = true;
            continue;
          }
        }

        const candidateScore = scoreSeatingRelationships(
          input.attendees,
          candidate,
        ).score;

        if (candidateScore > bestScore) {
          bestAssignments = candidate;
          bestScore = candidateScore;
          improved = true;
        }
      }
    }

    if (!improved) {
      break;
    }

    assignments = bestAssignments;
    score = bestScore;
    currentViolations = bestViolations;
    swapsAccepted += 1;
  }

  const relationshipExplanations = explainAssignments(input.attendees, assignments);
  const explanations: Record<string, SeatExplanation[]> = { ...input.explanations };

  for (const [seatKey, items] of Object.entries(relationshipExplanations)) {
    explanations[seatKey] = [...(explanations[seatKey] ?? []), ...items];
  }

  return {
    assignments,
    explanations,
    swapsAttempted,
    swapsAccepted,
    swapsRejectedForSeparation,
    score,
  };
}
