import type { Attendee } from "@/lib/types/attendee";
import { parsePositionKey } from "./geometry";
import { scoreRelationshipPair } from "./scoring";
import type { SeatExplanation, SeatingIssue } from "./types";

export type Phase2Input = {
  attendees: Attendee[];
  assignments: Record<string, string>;
  placedAttendeeIds: Set<string>;
  availableSeatKeys: string[];
  explanations: Record<string, SeatExplanation[]>;
};

export type Phase2Result = Phase2Input & {
  issues: SeatingIssue[];
};

type PlacementScore = {
  attendee: Attendee;
  seatKey: string;
  score: number;
  explanations: SeatExplanation[];
};

function remainingAttendees(attendees: Attendee[], placedAttendeeIds: Set<string>) {
  return attendees
    .filter((attendee) => !placedAttendeeIds.has(attendee.id))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

function scorePlacement(
  attendee: Attendee,
  seatKey: string,
  attendeesById: Map<string, Attendee>,
  assignments: Record<string, string>,
): PlacementScore {
  const seatPosition = parsePositionKey(seatKey);
  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (const [placedSeatKey, placedAttendeeId] of Object.entries(assignments)) {
    const placedAttendee = attendeesById.get(placedAttendeeId);
    if (!placedAttendee) continue;

    const pairScore = scoreRelationshipPair(
      attendee,
      seatPosition,
      placedAttendee,
      parsePositionKey(placedSeatKey),
    );
    score += pairScore.score;
    explanations.push(...pairScore.explanations);
  }

  return { attendee, seatKey, score, explanations };
}

export function placeRemainingAttendees(input: Phase2Input): Phase2Result {
  const assignments = { ...input.assignments };
  const placedAttendeeIds = new Set(input.placedAttendeeIds);
  const availableSeatKeys = [...input.availableSeatKeys].toSorted();
  const explanations = { ...input.explanations };
  const issues: SeatingIssue[] = [];
  const attendeesById = new Map(input.attendees.map((attendee) => [attendee.id, attendee]));
  const remaining = remainingAttendees(input.attendees, placedAttendeeIds);

  while (remaining.length > 0 && availableSeatKeys.length > 0) {
    const ranked: PlacementScore[] = [];

    for (const attendee of remaining) {
      for (const seatKey of availableSeatKeys) {
        ranked.push(scorePlacement(attendee, seatKey, attendeesById, assignments));
      }
    }

    ranked.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      const nameDiff = a.attendee.name.localeCompare(b.attendee.name);
      if (nameDiff !== 0) return nameDiff;

      return a.seatKey.localeCompare(b.seatKey);
    });

    const best = ranked[0];
    assignments[best.seatKey] = best.attendee.id;
    placedAttendeeIds.add(best.attendee.id);
    explanations[best.seatKey] = best.explanations;

    remaining.splice(
      remaining.findIndex((attendee) => attendee.id === best.attendee.id),
      1,
    );
    availableSeatKeys.splice(
      availableSeatKeys.findIndex((seatKey) => seatKey === best.seatKey),
      1,
    );
  }

  for (const attendee of remaining) {
    issues.push({
      severity: "warning",
      message: `No available seat for ${attendee.name}.`,
      externalIds: [attendee.id],
    });
  }

  return {
    attendees: input.attendees,
    assignments,
    placedAttendeeIds,
    availableSeatKeys,
    issues,
    explanations,
  };
}
