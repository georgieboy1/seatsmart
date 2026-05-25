import type { Attendee } from "@/lib/types/attendee";
import { explainAssignments, scoreSeatingRelationships } from "./scoring";
import type { SeatExplanation } from "./types";

export type Phase3Input = {
  attendees: Attendee[];
  assignments: Record<string, string>;
  explanations: Record<string, SeatExplanation[]>;
  lockedSeatKeys?: Set<string>;
  maxIterations?: number;
};

export type Phase3Result = {
  assignments: Record<string, string>;
  explanations: Record<string, SeatExplanation[]>;
  swapsAttempted: number;
  swapsAccepted: number;
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
  const maxIterations = input.maxIterations ?? 100;
  const lockedSeatKeys = input.lockedSeatKeys ?? new Set<string>();

  const swappableSeatKeys = Object.keys(assignments)
    .filter((seatKey) => !lockedSeatKeys.has(seatKey))
    .toSorted();

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let bestAssignments = assignments;
    let bestScore = score;
    let improved = false;

    for (let i = 0; i < swappableSeatKeys.length; i += 1) {
      for (let j = i + 1; j < swappableSeatKeys.length; j += 1) {
        swapsAttempted += 1;

        const candidate = swapAssignments(
          assignments,
          swappableSeatKeys[i],
          swappableSeatKeys[j],
        );
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
    score,
  };
}
