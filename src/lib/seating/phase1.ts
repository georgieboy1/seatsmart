import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { getSeatCandidates, positionKey } from "./geometry";
import { scoreConstraintsFit } from "./scoring";
import type { SeatExplanation, SeatingIssue } from "./types";

export type Phase1Result = {
  assignments: Record<string, string>;
  placedAttendeeIds: Set<string>;
  availableSeatKeys: string[];
  issues: SeatingIssue[];
  explanations: Record<string, SeatExplanation[]>;
};

function constrainedAttendees(attendees: Attendee[]): Attendee[] {
  return attendees
    .filter((attendee) => attendee.constraints.length > 0)
    .toSorted((a, b) => {
      const accommodationDiff = b.constraints.length - a.constraints.length;
      if (accommodationDiff !== 0) return accommodationDiff;
      return a.name.localeCompare(b.name);
    });
}

export function placeDietaryAccessibilityAttendees(
  attendees: Attendee[],
  layout: ClassroomLayout,
  lockedSeats: Record<string, string> = {},
): Phase1Result {
  const candidates = getSeatCandidates(layout);
  const candidateKeys = new Set(candidates.map((candidate) => candidate.key));
  const assignments: Record<string, string> = {};
  const explanations: Record<string, SeatExplanation[]> = {};
  const issues: SeatingIssue[] = [];
  const placedAttendeeIds = new Set<string>();

  for (const [seatKey, externalId] of Object.entries(lockedSeats)) {
    if (!candidateKeys.has(seatKey)) {
      issues.push({
        severity: "warning",
        message: `Locked seat ${seatKey} is not an assignable seat and was ignored.`,
        externalIds: [externalId],
      });
      continue;
    }

    assignments[seatKey] = externalId;
    explanations[seatKey] = [];
    placedAttendeeIds.add(externalId);
  }

  const available = candidates.filter((candidate) => !assignments[candidate.key]);

  for (const attendee of constrainedAttendees(attendees)) {
    if (placedAttendeeIds.has(attendee.id)) {
      continue;
    }

    if (available.length === 0) {
      issues.push({
        severity: "warning",
        message: `No available seat for ${attendee.name}'s constraints.`,
        externalIds: [attendee.id],
      });
      continue;
    }

    const ranked = available
      .map((candidate) => {
        const fit = scoreConstraintsFit(attendee, layout, candidate.position);
        return { candidate, ...fit };
      })
      .toSorted((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.candidate.key.localeCompare(b.candidate.key);
      });

    const best = ranked[0];
    assignments[best.candidate.key] = attendee.id;
    explanations[best.candidate.key] = best.explanations;
    placedAttendeeIds.add(attendee.id);
    available.splice(
      available.findIndex((candidate) => candidate.key === best.candidate.key),
      1,
    );

    if (best.score < 0) {
      issues.push({
        severity: "warning",
        message: `${attendee.name}'s constraints could not be fully satisfied.`,
        externalIds: [attendee.id],
        position: best.candidate.position,
      });
    }
  }

  return {
    assignments,
    placedAttendeeIds,
    availableSeatKeys: available.map((candidate) =>
      positionKey(candidate.position),
    ),
    issues,
    explanations,
  };
}
