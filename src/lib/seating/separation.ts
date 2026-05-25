import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { parsePositionKey } from "./geometry";
import {
  chebyshevDistance,
  isSufficientlySeparated,
} from "./distance";
import type { SeatPosition } from "./types";

export type SeparationConstraint = {
  attendeeA: string;
  attendeeB: string;
  minDistance: number;
};

export type SeparationViolation = {
  attendeeA: string;
  attendeeB: string;
  seatA: string;
  seatB: string;
  actualDistance: number;
  minDistance: number;
};

/**
 * Build the set of separation constraints from each attendee's
 * separateIds list. Pairs are deduplicated regardless of direction —
 * (A,B) and (B,A) become one constraint.
 *
 * The defaultD parameter is exposed so this is straightforward to wire
 * to a UI slider later. Today every constraint shares the same minimum;
 * per-pair severity is a v1.1 concern.
 */
export function separationConstraints(
  attendees: Attendee[],
  defaultD = 2,
): SeparationConstraint[] {
  const constraints: SeparationConstraint[] = [];
  const seen = new Set<string>();

  for (const att of attendees) {
    for (const otherId of att.separateIds ?? []) {
      // Skip self-references (defensive — shouldn't occur in valid data)
      if (otherId === att.id) continue;
      const pair = [att.id, otherId].sort();
      const key = `${pair[0]}|${pair[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      constraints.push({
        attendeeA: pair[0],
        attendeeB: pair[1],
        minDistance: defaultD,
      });
    }
  }

  return constraints;
}

/**
 * Find every separation violation in the current assignment map.
 * Returned violations carry actualDistance / minDistance so the UI can
 * say "Maya and Jordan must be ≥3 apart but sit 1 apart."
 */
export function checkSeparation(
  assignments: Record<string, string>,
  constraints: SeparationConstraint[],
  layout: ClassroomLayout,
  podMap: Map<string, number>,
): SeparationViolation[] {
  // Build attendeeId -> seatKey
  const seatByAttendee = new Map<string, string>();
  for (const [seatKey, attendeeId] of Object.entries(assignments)) {
    seatByAttendee.set(attendeeId, seatKey);
  }

  const violations: SeparationViolation[] = [];
  for (const c of constraints) {
    const seatA = seatByAttendee.get(c.attendeeA);
    const seatB = seatByAttendee.get(c.attendeeB);
    if (!seatA || !seatB) continue; // one of them isn't placed yet

    const posA = parsePositionKey(seatA);
    const posB = parsePositionKey(seatB);

    if (isSufficientlySeparated(posA, posB, c.minDistance, podMap, layout)) {
      continue;
    }

    violations.push({
      attendeeA: c.attendeeA,
      attendeeB: c.attendeeB,
      seatA,
      seatB,
      actualDistance: chebyshevDistance(posA, posB),
      minDistance: c.minDistance,
    });
  }

  return violations;
}

/**
 * Returns true iff placing `attendeeId` at `seatKey` doesn't violate
 * any separation constraint against already-placed attendees.
 *
 * Use this to FILTER candidate seats during phase1/phase2 placement —
 * if every candidate is infeasible, fall back to placeBestEffort below.
 */
export function isSeatFeasible(
  seatKey: string,
  attendeeId: string,
  assignments: Record<string, string>,
  constraints: SeparationConstraint[],
  layout: ClassroomLayout,
  podMap: Map<string, number>,
): boolean {
  const relevant = constraints.filter(
    (c) => c.attendeeA === attendeeId || c.attendeeB === attendeeId,
  );
  if (relevant.length === 0) return true;

  const seatByAttendee = new Map<string, string>();
  for (const [s, a] of Object.entries(assignments)) {
    seatByAttendee.set(a, s);
  }

  const candidatePos = parsePositionKey(seatKey);
  for (const c of relevant) {
    const otherId = c.attendeeA === attendeeId ? c.attendeeB : c.attendeeA;
    const otherSeat = seatByAttendee.get(otherId);
    if (!otherSeat) continue; // other attendee not yet placed; no conflict possible yet
    const otherPos = parsePositionKey(otherSeat);
    if (!isSufficientlySeparated(candidatePos, otherPos, c.minDistance, podMap, layout)) {
      return false;
    }
  }

  return true;
}

/**
 * Count the number of separation violations that would result from
 * placing `attendeeId` at `seatKey`. Used for "least-violating
 * fallback" when no feasible seat exists.
 */
export function countViolations(
  seatKey: string,
  attendeeId: string,
  assignments: Record<string, string>,
  constraints: SeparationConstraint[],
  layout: ClassroomLayout,
  podMap: Map<string, number>,
): number {
  const relevant = constraints.filter(
    (c) => c.attendeeA === attendeeId || c.attendeeB === attendeeId,
  );
  if (relevant.length === 0) return 0;

  const seatByAttendee = new Map<string, string>();
  for (const [s, a] of Object.entries(assignments)) {
    seatByAttendee.set(a, s);
  }

  const candidatePos = parsePositionKey(seatKey);
  let count = 0;
  for (const c of relevant) {
    const otherId = c.attendeeA === attendeeId ? c.attendeeB : c.attendeeA;
    const otherSeat = seatByAttendee.get(otherId);
    if (!otherSeat) continue;
    const otherPos = parsePositionKey(otherSeat);
    if (!isSufficientlySeparated(candidatePos, otherPos, c.minDistance, podMap, layout)) {
      count += 1;
    }
  }
  return count;
}

/**
 * From the partner's perspective: which already-placed attendees does
 * this candidate seat conflict with? Used to build the
 * `min_distance_violated` explanation when we fall back.
 */
export function violatingPartners(
  seatKey: string,
  attendeeId: string,
  assignments: Record<string, string>,
  attendeesById: Map<string, Attendee>,
  constraints: SeparationConstraint[],
  layout: ClassroomLayout,
  podMap: Map<string, number>,
): Attendee[] {
  const relevant = constraints.filter(
    (c) => c.attendeeA === attendeeId || c.attendeeB === attendeeId,
  );
  if (relevant.length === 0) return [];

  const seatByAttendee = new Map<string, string>();
  for (const [s, a] of Object.entries(assignments)) {
    seatByAttendee.set(a, s);
  }

  const candidatePos: SeatPosition = parsePositionKey(seatKey);
  const result: Attendee[] = [];
  for (const c of relevant) {
    const otherId = c.attendeeA === attendeeId ? c.attendeeB : c.attendeeA;
    const otherSeat = seatByAttendee.get(otherId);
    if (!otherSeat) continue;
    const otherPos = parsePositionKey(otherSeat);
    if (!isSufficientlySeparated(candidatePos, otherPos, c.minDistance, podMap, layout)) {
      const other = attendeesById.get(otherId);
      if (other) result.push(other);
    }
  }
  return result;
}
