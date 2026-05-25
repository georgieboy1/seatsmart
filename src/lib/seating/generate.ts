import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { parsePositionKey } from "./geometry";
import { placeDietaryAccessibilityAttendees } from "./phase1";
import { placeRemainingAttendees } from "./phase2";
import { optimizeSeatSwaps } from "./phase3";
import type { GenerationOptions, SeatingIssue, SeatingResult } from "./types";

const DEFAULT_OPTIONS: GenerationOptions = {
  honorDietaryAccessibility: true,
  respectMustSitTogether: true,
  respectStrictlySeparate: true,
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

function attendeesForPhase1(
  attendees: Attendee[],
  options: GenerationOptions,
): Attendee[] {
  if (options.honorDietaryAccessibility) {
    return attendees;
  }

  return attendees.map((attendee) => ({ ...attendee, constraints: [] }));
}

function separateIdsViolationIssues(
  attendees: Attendee[],
  assignments: Record<string, string>,
): SeatingIssue[] {
  const attendeesById = new Map(attendees.map((attendee) => [attendee.id, attendee]));
  const placed = Object.entries(assignments).map(([seatKey, externalId]) => ({
    seatKey,
    position: parsePositionKey(seatKey),
    attendee: attendeesById.get(externalId),
  }));
  const issues: SeatingIssue[] = [];

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i].attendee;
      const b = placed[j].attendee;
      if (!a || !b) continue;

      const adjacent =
        Math.abs(placed[i].position.row - placed[j].position.row) <= 1 &&
        Math.abs(placed[i].position.column - placed[j].position.column) <= 1 &&
        placed[i].seatKey !== placed[j].seatKey;
      const separateIdsMatch = a.separateIds.includes(b.id) || b.separateIds.includes(a.id);

      if (adjacent && separateIdsMatch) {
        issues.push({
          severity: "warning",
          message: `${a.name} and ${b.name} are on an separateIds list but sit adjacent.`,
          externalIds: [a.id, b.id],
        });
      }
    }
  }

  return issues;
}

export function generateSeating(
  attendees: Attendee[],
  classroom: ClassroomLayout,
  options: GenerationOptions,
): SeatingResult {
  const mergedOptions = mergeOptions(options);
  const phase1Started = performance.now();
  const phase1 = placeDietaryAccessibilityAttendees(
    attendeesForPhase1(attendees, mergedOptions),
    classroom,
    mergedOptions.lockedSeats,
  );
  const phase1Time = performance.now() - phase1Started;

  const phase2Started = performance.now();
  const phase2 = placeRemainingAttendees({
    attendees,
    assignments: phase1.assignments,
    placedAttendeeIds: phase1.placedAttendeeIds,
    availableSeatKeys: phase1.availableSeatKeys,
    explanations: phase1.explanations,
  });
  const phase2Time = performance.now() - phase2Started;

  const phase3 = optimizeSeatSwaps({
    attendees,
    assignments: phase2.assignments,
    explanations: phase2.explanations,
    lockedSeatKeys: new Set(Object.keys(mergedOptions.lockedSeats ?? {})),
    maxIterations: 100,
  });

  const issues = [
    ...phase1.issues,
    ...phase2.issues,
    ...(mergedOptions.respectStrictlySeparate
      ? separateIdsViolationIssues(attendees, phase3.assignments)
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
