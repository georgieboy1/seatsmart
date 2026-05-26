import type { ClassroomLayout } from "@/lib/types/layout";
import { positionKey } from "./geometry";
import type { SeatPosition } from "./types";

/**
 * Chebyshev distance — the max of row and column deltas. Two seats with
 * Chebyshev distance 1 are in the 8-neighbor ring (orthogonal or
 * diagonal). This is the codebase's adjacency definition (see isAdjacent
 * in geometry.ts), kept consistent here so "minimum distance D=2" means
 * "outside the 8-neighbor ring."
 */
export function chebyshevDistance(a: SeatPosition, b: SeatPosition): number {
  return Math.max(
    Math.abs(a.row - b.row),
    Math.abs(a.column - b.column),
  );
}

/**
 * All seat positions within Chebyshev `radius` of `center`, inclusive of
 * the center itself.
 */
export function seatsWithinRadius(
  layout: ClassroomLayout,
  center: SeatPosition,
  radius: number,
): SeatPosition[] {
  const results: SeatPosition[] = [];
  for (let r = 0; r < layout.grid.length; r += 1) {
    const row = layout.grid[r];
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] !== "seat") continue;
      const pos: SeatPosition = { row: r, column: c };
      if (chebyshevDistance(center, pos) <= radius) {
        results.push(pos);
      }
    }
  }
  return results;
}

/**
 * Compute a Map<seatKey, podId>. Each connected component of "seat"
 * cells (4-directional BFS — perimeter cells form the walls between
 * pods) is one pod.
 *
 * - Traditional layouts collapse to a single pod (all seats are mutually
 *   reachable via cardinal moves over interior seats).
 * - Groups layouts produce one pod per cluster, with perimeter rows /
 *   columns separating them.
 *
 * Note: 4-directional (not 8) is intentional. Two seats that are
 * diagonal across a perimeter wall are physically on opposite sides of
 * the wall and belong to different pods.
 */
export function computePodMap(layout: ClassroomLayout): Map<string, number> {
  const podMap = new Map<string, number>();
  const grid = layout.grid;
  if (grid.length === 0) return podMap;

  let nextPodId = 0;

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (grid[r][c] !== "seat") continue;
      const key = positionKey({ row: r, column: c });
      if (podMap.has(key)) continue;

      // BFS the connected component starting here.
      const podId = nextPodId;
      nextPodId += 1;
      const queue: SeatPosition[] = [{ row: r, column: c }];
      podMap.set(key, podId);

      while (queue.length > 0) {
        const pos = queue.shift()!;
        const neighbors: SeatPosition[] = [
          { row: pos.row - 1, column: pos.column },
          { row: pos.row + 1, column: pos.column },
          { row: pos.row, column: pos.column - 1 },
          { row: pos.row, column: pos.column + 1 },
        ];

        for (const n of neighbors) {
          if (n.row < 0 || n.row >= grid.length) continue;
          const nrow = grid[n.row];
          if (n.column < 0 || n.column >= nrow.length) continue;
          if (nrow[n.column] !== "seat") continue;
          const nkey = positionKey(n);
          if (podMap.has(nkey)) continue;
          podMap.set(nkey, podId);
          queue.push(n);
        }
      }
    }
  }

  return podMap;
}

/**
 * Returns true iff two seats satisfy a minimum-separation constraint.
 *
 * - Groups layouts: different pod => satisfied (separate desk groups are a
 *   hard social barrier; physical distance is irrelevant once students are in
 *   different groups).
 * - All layouts: Chebyshev distance >= minDistance => satisfied.
 */
export function isSufficientlySeparated(
  a: SeatPosition,
  b: SeatPosition,
  minDistance: number,
  podMap: Map<string, number>,
  layout: ClassroomLayout,
): boolean {
  if (layout.type === "groups") {
    const podA = podMap.get(positionKey(a));
    const podB = podMap.get(positionKey(b));
    if (podA !== undefined && podB !== undefined && podA !== podB) {
      return true;
    }
  }
  return chebyshevDistance(a, b) >= minDistance;
}
