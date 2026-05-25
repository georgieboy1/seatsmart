import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { getSeatCandidates, positionKey } from "./geometry";
import { scoreConstraintsFit } from "./scoring";
import {
  countViolations,
  isSeatFeasible,
  violatingPartners,
  type SeparationConstraint,
} from "./separation";
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
  constraints: SeparationConstraint[] = [],
  podMap: Map<string, number> = new Map(),
): Phase1Result {
  const candidates = getSeatCandidates(layout);
  const candidateKeys = new Set(candidates.map((candidate) => candidate.key));
  const assignments: Record<string, string> = {};
  const explanations: Record<string, SeatExplanation[]> = {};
  const issues: SeatingIssue[] = [];
  const placedAttendeeIds = new Set<string>();
  const attendeesById = new Map(attendees.map((a) => [a.id, a]));
  const minDistance = constraints[0]?.minDistance ?? 2;

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
    explanations[seatKey] = explanations[seatKey] ?? [];
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

    const feasibleRanked = ranked.filter((r) =>
      isSeatFeasible(
        r.candidate.key,
        attendee.id,
        assignments,
        constraints,
        layout,
        podMap,
      ),
    );

    let chosen: (typeof ranked)[number];
    let isViolation = false;
    let tradeoff = false;

    if (feasibleRanked.length > 0) {
      chosen = feasibleRanked[0];
      tradeoff = chosen.candidate.key !== ranked[0].candidate.key;
    } else {
      // No feasible seat — best-effort fallback to least-violating.
      const byViolation = ranked
        .map((r) => ({
          r,
          violations: countViolations(
            r.candidate.key,
            attendee.id,
            assignments,
            constraints,
            layout,
            podMap,
          ),
        }))
        .sort((a, b) => {
          if (a.violations !== b.violations) return a.violations - b.violations;
          return b.r.score - a.r.score;
        });
      chosen = byViolation[0].r;
      isViolation = true;
    }

    assignments[chosen.candidate.key] = attendee.id;
    const seatExplanations: SeatExplanation[] = [...chosen.explanations];

    if (tradeoff) {
      const partners = violatingPartners(
        ranked[0].candidate.key,
        attendee.id,
        assignments,
        attendeesById,
        constraints,
        layout,
        podMap,
      );
      seatExplanations.push({
        rule: "min_distance_kept",
        weight: 5,
        reason: `Placed here to keep ${attendee.name} ≥${minDistance} seats from ${partners.map((p) => p.name).join(", ") || "conflicted attendees"}.`,
      });
    }

    if (isViolation) {
      const partners = violatingPartners(
        chosen.candidate.key,
        attendee.id,
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
        reason: `${attendee.name} could not be separated from ${partnerNames} — no seat in this room satisfies the ≥${minDistance} minimum.`,
      });
      issues.push({
        severity: "error",
        message: `${attendee.name} must be ≥${minDistance} seats apart from ${partnerNames} but the room is too small.`,
        externalIds: [attendee.id, ...partners.map((p) => p.id)],
      });
    }

    explanations[chosen.candidate.key] = seatExplanations;
    placedAttendeeIds.add(attendee.id);
    available.splice(
      available.findIndex((candidate) => candidate.key === chosen.candidate.key),
      1,
    );

    if (chosen.score < 0 && !isViolation) {
      issues.push({
        severity: "warning",
        message: `${attendee.name}'s constraints could not be fully satisfied.`,
        externalIds: [attendee.id],
        position: chosen.candidate.position,
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
