import type { CellType, ClassroomLayout } from "@/lib/types/layout";
import type { SeatCandidate, SeatPosition } from "./types";

export function positionKey(position: SeatPosition): string {
  return `${position.row},${position.column}`;
}

export function parsePositionKey(key: string): SeatPosition {
  const [row, column] = key.split(",").map(Number);

  if (!Number.isInteger(row) || !Number.isInteger(column)) {
    throw new Error(`Invalid seat position key: ${key}`);
  }

  return { row, column };
}

export function getSeatCandidates(layout: ClassroomLayout): SeatCandidate[] {
  const candidates: SeatCandidate[] = [];

  layout.grid.forEach((row, rowIndex) => {
    row.forEach((cellType, columnIndex) => {
      if (cellType !== "seat") return;

      const position = { row: rowIndex, column: columnIndex };
      candidates.push({
        position,
        key: positionKey(position),
        cellType,
        layout,
      });
    });
  });

  return candidates;
}

export function isAdjacent(a: SeatPosition, b: SeatPosition): boolean {
  const rowDelta = Math.abs(a.row - b.row);
  const columnDelta = Math.abs(a.column - b.column);

  return rowDelta <= 1 && columnDelta <= 1 && rowDelta + columnDelta > 0;
}

export function manhattanDistance(a: SeatPosition, b: SeatPosition): number {
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column);
}

export function findFeaturePositions(
  layout: ClassroomLayout,
  cellType: CellType,
): SeatPosition[] {
  const positions: SeatPosition[] = [];

  layout.grid.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === cellType) {
        positions.push({ row: rowIndex, column: columnIndex });
      }
    });
  });

  return positions;
}

export function isFrontOfRoom(position: SeatPosition): boolean {
  return position.row <= 1;
}
