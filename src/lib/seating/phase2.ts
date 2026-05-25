import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
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
  attendees: Attendee[];
  assignments: Record<string, string>;
  placedAttendeeIds: Set<string>;
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
  attendee: Attendee;
  seatKey: string;
  score: number;
  explanations: SeatExplanation[];
  feasible: boolean;
  violations: number;
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
  layout: ClassroomLayout | undefined,
  podMap: Map<string, number>,
  constraints: SeparationConstraint[],
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

  const feasible = layout
    ? isSeatFeasible(
        seatKey,
        attendee.id,
        assignments,
        constraints,
        layout,
        podMap,
      )
    : true;

  const violations = layout && !feasible
    ? countViolations(
        seatKey,
        attendee.id,
        assignments,
        constraints,
        layout,
        podMap,
      )
    : 0;

  return { attendee, seatKey, score, explanations, feasible, violations };
}

export function placeRemainingAttendees(input: Phase2Input): Phase2Result {
  const assignments = { ...input.assignments };
  const placedAttendeeIds = new Set(input.placedAttendeeIds);
  const availableSeatKeys = [...input.availableSeatKeys].toSorted();
  const explanations = { ...input.explanations };
  const issues: SeatingIssue[] = [];
  const attendeesById = new Map(input.attendees.map((a) => [a.id, a]));
  const remaining = remainingAttendees(input.attendees, placedAttendeeIds);
  const layout = input.layout;
  const podMap = input.podMap ?? new Map<string, number>();
  const constraints = input.constraints ?? [];
  const minDistance = constraints[0]?.minDistance ?? 2;

  while (remaining.length > 0 && availableSeatKeys.length > 0) {
    const ranked: PlacementScore[] = [];

    for (const attendee of remaining) {
      for (const seatKey of availableSeatKeys) {
        ranked.push(
          scorePlacement(
            attendee,
            seatKey,
            attendeesById,
            assignments,
            layout,
            podMap,
            constraints,
          ),
        );
      }
    }

    // Sort: feasible first, then by violation count asc (matters only
    // when ALL options are infeasible for some attendee), then by score
    // desc, then by name, then by seat key.
    ranked.sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      if (!a.feasible && !b.feasible && a.violations !== b.violations) {
        return a.violations - b.violations;
      }
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const nameDiff = a.attendee.name.localeCompare(b.attendee.name);
      if (nameDiff !== 0) return nameDiff;
      return a.seatKey.localeCompare(b.seatKey);
    });

    const best = ranked[0];
    assignments[best.seatKey] = best.attendee.id;
    placedAttendeeIds.add(best.attendee.id);

    const seatExplanations: SeatExplanation[] = [...best.explanations];

    if (!best.feasible && layout) {
      const partners = violatingPartners(
        best.seatKey,
        best.attendee.id,
        assignments,
        attendeesById,
        constraints,
        layout,
        podMap,
      );
      const partnerNames =
        partners.map((p) => p.name).join(", ") || "another conflicted attendee";
      seatExplanations.push({
        rule: "min_distance_violated",
        weight: -50,
        reason: `${best.attendee.name} could not be separated from ${partnerNames} — no seat in this room satisfies the ≥${minDistance} minimum.`,
      });
      issues.push({
        severity: "error",
        message: `${best.attendee.name} must be ≥${minDistance} seats apart from ${partnerNames} but the room is too small.`,
        externalIds: [best.attendee.id, ...partners.map((p) => p.id)],
      });
    }

    explanations[best.seatKey] = seatExplanations;

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
    layout,
    podMap,
    constraints,
  };
}
