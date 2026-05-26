import type { CellType, ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import type { DietaryAccessibility } from "@/lib/students/constants";
import {
  findFeaturePositions,
  isAdjacent,
  isFrontOfRoom,
  manhattanDistance,
  parsePositionKey,
} from "./geometry";
import type { SeatExplanation, SeatPosition } from "./types";

type ScoreResult = {
  score: number;
  explanations: SeatExplanation[];
};

const FEATURE_CONSTRAINTS: Partial<Record<DietaryAccessibility, CellType>> = {
  near_door: "door",
  near_teacher: "teacher_desk",
  near_charging: "charging_station",
  away_from_window: "window",
};

function explanation(
  rule: string,
  weight: number,
  reason: string,
): SeatExplanation {
  return { rule, weight, reason };
}

function nearestDistance(
  layout: ClassroomLayout,
  position: SeatPosition,
  cellType: CellType,
): number | null {
  const features = findFeaturePositions(layout, cellType);
  if (features.length === 0) return null;

  return Math.min(
    ...features.map((feature) => manhattanDistance(position, feature)),
  );
}

function sideOfRoomScore(
  layout: ClassroomLayout,
  position: SeatPosition,
  side: "left" | "right",
): number {
  const width = Math.max(...layout.grid.map((row) => row.length));
  const midpoint = (width - 1) / 2;

  if (side === "left") {
    return position.column <= midpoint ? 20 : -20;
  }

  return position.column >= midpoint ? 20 : -20;
}

export function scoreConstraintsFit(
  student: Student,
  layout: ClassroomLayout,
  position: SeatPosition,
): ScoreResult {
  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (const constraint of student.constraints) {
    if (constraint === "front_of_room" || constraint === "vision_front") {
      const weight = isFrontOfRoom(position) ? 30 : -30;
      score += weight;
      explanations.push(
        explanation(
          constraint,
          weight,
          isFrontOfRoom(position)
            ? `${student.name} placed at the front for support.`
            : `${student.name} not placed at the front.`,
        ),
      );
      continue;
    }

    if (constraint === "hearing_left" || constraint === "hearing_right") {
      const side = constraint === "hearing_left" ? "left" : "right";
      const weight = sideOfRoomScore(layout, position, side);
      score += weight;
      explanations.push(
        explanation(
          constraint,
          weight,
          weight > 0
            ? `${student.name} seated on the ${side} for hearing support.`
            : `${student.name} not on the ${side} side.`,
        ),
      );
      continue;
    }

    const feature = FEATURE_CONSTRAINTS[constraint as DietaryAccessibility];
    if (!feature) continue;

    const distance = nearestDistance(layout, position, feature);
    if (distance == null) {
      explanations.push(
        explanation(
          constraint,
          -15,
          `No ${feature.replaceAll("_", " ")} available for ${student.name}'s accommodation.`,
        ),
      );
      score -= 15;
      continue;
    }

    const weight =
      constraint === "away_from_window"
        ? Math.min(distance * 8, 32)
        : Math.max(32 - distance * 8, -16);
    score += weight;
    explanations.push(
      explanation(
        constraint,
        weight,
        constraint === "away_from_window"
          ? `${student.name} placed away from windows.`
          : `${student.name} placed near ${feature.replaceAll("_", " ")} for support.`,
      ),
    );
  }

  return { score, explanations };
}

export function scoreRelationshipPair(
  a: Student,
  aPosition: SeatPosition,
  b: Student,
  bPosition: SeatPosition,
): ScoreResult {
  if (!isAdjacent(aPosition, bPosition)) {
    return { score: 0, explanations: [] };
  }

  let score = 0;
  const explanations: SeatExplanation[] = [];

  const togetherMatch = a.togetherIds.includes(b.id) || b.togetherIds.includes(a.id);
  if (togetherMatch) {
    score += 10;
    explanations.push(
      explanation(
        "together_list_adjacency",
        10,
        `${a.name} placed beside peer support ${b.name}.`,
      ),
    );
  }

  const separateMatch = a.separateIds.includes(b.id) || b.separateIds.includes(a.id);
  if (separateMatch) {
    score -= 50;
    explanations.push(
      explanation(
        "separate_list_adjacency",
        -50,
        `${a.name} and ${b.name} are adjacent despite "avoid pairing" request.`,
      ),
    );
  }

  const bothAntisocial =
    a.antisocialTraits.length > 0 && b.antisocialTraits.length > 0;
  if (bothAntisocial) {
    score -= 5;
    explanations.push(
      explanation(
        "social_clash_adjacency",
        -5,
        `${a.name} and ${b.name} both have social traits that may clash.`,
      ),
    );
  }

  const peerModeling =
    (a.prosocialTraits.length > 0 && b.antisocialTraits.length > 0) ||
    (b.prosocialTraits.length > 0 && a.antisocialTraits.length > 0);
  if (peerModeling) {
    score += 3;
    explanations.push(
      explanation(
        "social_pairing",
        3,
        `${a.name} and ${b.name} create a possible social balance pairing.`,
      ),
    );
  }

  return { score, explanations };
}

export function scoreSeatingRelationships(
  students: Student[],
  assignments: Record<string, string>,
): ScoreResult {
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const placed = Object.entries(assignments)
    .map(([key, externalId]) => {
      const student = studentsById.get(externalId);
      return student ? { key, student, position: parsePositionKey(key) } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const pairScore = scoreRelationshipPair(
        placed[i].student,
        placed[i].position,
        placed[j].student,
        placed[j].position,
      );
      score += pairScore.score;
      explanations.push(...pairScore.explanations);
    }
  }

  return { score, explanations };
}

export function explainAssignments(
  students: Student[],
  assignments: Record<string, string>,
): Record<string, SeatExplanation[]> {
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const explanations: Record<string, SeatExplanation[]> = {};
  const placed = Object.entries(assignments)
    .map(([key, externalId]) => {
      const student = studentsById.get(externalId);
      return student ? { key, student, position: parsePositionKey(key) } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  for (const { key } of placed) {
    explanations[key] = [];
  }

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const pairScore = scoreRelationshipPair(
        placed[i].student,
        placed[i].position,
        placed[j].student,
        placed[j].position,
      );

      if (pairScore.explanations.length === 0) continue;

      explanations[placed[i].key].push(...pairScore.explanations);
      explanations[placed[j].key].push(...pairScore.explanations);
    }
  }

  return explanations;
}
