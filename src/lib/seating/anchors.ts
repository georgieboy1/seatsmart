import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { positionKey } from "./geometry";
import { chebyshevDistance, computePodMap } from "./distance";
import type { SeatPosition } from "./types";

/**
 * Anchor cell types (cells whose adjacent seats become anchors in
 * traditional layouts). The user-marked anchor feature is v1; this v0
 * derives anchors from existing layout signals so we ship without
 * schema changes.
 */
const TRADITIONAL_ANCHOR_CELL_TYPES = ["teacher_desk", "whiteboard"] as const;

/**
 * Identify anchor seats for a layout.
 *
 * Traditional layouts: every seat at Chebyshev distance 1 from a
 * teacher_desk or whiteboard cell. These are the "front row" seats,
 * the natural focal points of a classroom.
 *
 * Groups layouts: in each pod, the seat closest to the geometric
 * center of the grid. The "head table" pod gets its center seat as an
 * anchor; far-pod center seats are also anchors. This rewards the
 * social cluster nearest the room's focal point.
 *
 * Returns positions sorted by (row, column) for determinism.
 */
export function identifyAnchors(layout: ClassroomLayout): SeatPosition[] {
  if (layout.type === "groups") {
    return identifyGroupAnchors(layout);
  }
  return identifyTraditionalAnchors(layout);
}

function identifyTraditionalAnchors(layout: ClassroomLayout): SeatPosition[] {
  const grid = layout.grid;
  const anchors: SeatPosition[] = [];

  // Collect all anchor-source cell positions
  const anchorSources: SeatPosition[] = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      const cell = grid[r][c];
      if ((TRADITIONAL_ANCHOR_CELL_TYPES as readonly string[]).includes(cell)) {
        anchorSources.push({ row: r, column: c });
      }
    }
  }

  if (anchorSources.length === 0) return [];

  // Any seat adjacent (Chebyshev=1) to any source is an anchor.
  const seen = new Set<string>();
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (grid[r][c] !== "seat") continue;
      const pos = { row: r, column: c };
      const isAnchor = anchorSources.some(
        (src) => chebyshevDistance(src, pos) === 1,
      );
      if (!isAnchor) continue;
      const key = positionKey(pos);
      if (seen.has(key)) continue;
      seen.add(key);
      anchors.push(pos);
    }
  }

  return anchors.sort(positionSort);
}

function identifyGroupAnchors(layout: ClassroomLayout): SeatPosition[] {
  const grid = layout.grid;
  if (grid.length === 0) return [];

  // Geometric center of the grid
  const center: SeatPosition = {
    row: (grid.length - 1) / 2,
    column: (grid[0]?.length ?? 0 - 1) / 2,
  };

  const podMap = computePodMap(layout);

  // Bucket seats by pod
  const seatsByPod = new Map<number, SeatPosition[]>();
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (grid[r][c] !== "seat") continue;
      const pos = { row: r, column: c };
      const podId = podMap.get(positionKey(pos));
      if (podId === undefined) continue;
      const bucket = seatsByPod.get(podId) ?? [];
      bucket.push(pos);
      seatsByPod.set(podId, bucket);
    }
  }

  // For each pod, pick the seat closest to the grid center.
  // Tie-break by (row, column) for determinism.
  const anchors: SeatPosition[] = [];
  for (const seats of seatsByPod.values()) {
    const closest = seats
      .slice()
      .sort((a, b) => {
        const dA =
          (a.row - center.row) ** 2 + (a.column - center.column) ** 2;
        const dB =
          (b.row - center.row) ** 2 + (b.column - center.column) ** 2;
        if (dA !== dB) return dA - dB;
        if (a.row !== b.row) return a.row - b.row;
        return a.column - b.column;
      })[0];
    if (closest) anchors.push(closest);
  }

  return anchors.sort(positionSort);
}

function positionSort(a: SeatPosition, b: SeatPosition): number {
  if (a.row !== b.row) return a.row - b.row;
  return a.column - b.column;
}

/**
 * Compute network centrality on the togetherIds graph.
 * centrality(A) = |A.togetherIds| (outbound) + |{B : A.id ∈ B.togetherIds}| (inbound).
 *
 * Returns attendees sorted by centrality descending, with name as the
 * tie-breaker for determinism. Attendees with centrality 0 are
 * excluded — anchoring nobody-knows-anybody is meaningless social
 * signal.
 */
export function rankByTogetherCentrality(
  attendees: Attendee[],
): Array<{ attendee: Attendee; centrality: number }> {
  const inbound = new Map<string, number>();
  for (const att of attendees) {
    for (const id of att.togetherIds ?? []) {
      inbound.set(id, (inbound.get(id) ?? 0) + 1);
    }
  }

  return attendees
    .map((attendee) => ({
      attendee,
      centrality:
        (attendee.togetherIds?.length ?? 0) + (inbound.get(attendee.id) ?? 0),
    }))
    .filter((entry) => entry.centrality > 0)
    .sort((a, b) => {
      if (a.centrality !== b.centrality) return b.centrality - a.centrality;
      return a.attendee.name.localeCompare(b.attendee.name);
    });
}
