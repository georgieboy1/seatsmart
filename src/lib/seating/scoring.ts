import type { CellType, ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import type { Accommodation } from "@/lib/students/constants";
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

const FEATURE_ACCOMMODATIONS: Partial<Record<Accommodation, CellType>> = {
  near_door: "door",
  near_teacher: "teacher_desk",
  near_charging: "charging_station",
  away_from_window: "window",
};

const ACCOMMODATION_LABELS: Record<Accommodation, string> = {
  near_door: "near the door",
  near_teacher: "near the teacher",
  away_from_window: "away from windows",
  near_charging: "near charging",
  front_of_room: "front of room",
  hearing_left: "left side hearing support",
  hearing_right: "right side hearing support",
  vision_front: "front vision support",
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

export function scoreAccommodationFit(
  student: Student,
  layout: ClassroomLayout,
  position: SeatPosition,
): ScoreResult {
  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (const accommodation of student.accommodations) {
    if (accommodation === "front_of_room" || accommodation === "vision_front") {
      const weight = isFrontOfRoom(position) ? 30 : -30;
      score += weight;
      explanations.push(
        explanation(
          accommodation,
          weight,
          isFrontOfRoom(position)
            ? `${student.name} is placed at the front of the room.`
            : `${student.name} is not at the front of the room.`,
        ),
      );
      continue;
    }

    if (accommodation === "hearing_left" || accommodation === "hearing_right") {
      const side = accommodation === "hearing_left" ? "left" : "right";
      const weight = sideOfRoomScore(layout, position, side);
      score += weight;
      explanations.push(
        explanation(
          accommodation,
          weight,
          weight > 0
            ? `${student.name} is seated on the ${side} side of the room.`
            : `${student.name} is not seated on the ${side} side of the room.`,
        ),
      );
      continue;
    }

    const feature = FEATURE_ACCOMMODATIONS[accommodation];
    if (!feature) continue;

    const distance = nearestDistance(layout, position, feature);
    if (distance == null) {
      explanations.push(
        explanation(
          accommodation,
          -15,
          `No ${feature.replaceAll("_", " ")} is present for ${student.name}'s ${ACCOMMODATION_LABELS[accommodation]} accommodation.`,
        ),
      );
      score -= 15;
      continue;
    }

    const weight =
      accommodation === "away_from_window"
        ? Math.min(distance * 8, 32)
        : Math.max(32 - distance * 8, -16);
    score += weight;
    explanations.push(
      explanation(
        accommodation,
        weight,
        accommodation === "away_from_window"
          ? `${student.name} is ${distance} cell${distance === 1 ? "" : "s"} from the nearest window.`
          : `${student.name} is ${distance} cell${distance === 1 ? "" : "s"} from ${ACCOMMODATION_LABELS[accommodation]}.`,
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

  const peerTutorMatch = a.peerTutors.includes(b.id) || b.peerTutors.includes(a.id);
  if (peerTutorMatch) {
    score += 10;
    explanations.push(
      explanation(
        "peer_tutor_adjacency",
        10,
        `${a.name} and ${b.name} work well together and are adjacent.`,
      ),
    );
  }

  const avoidMatch = a.avoid.includes(b.id) || b.avoid.includes(a.id);
  if (avoidMatch) {
    score -= 50;
    explanations.push(
      explanation(
        "avoid_adjacency",
        -50,
        `${a.name} and ${b.name} are on an avoid list but are adjacent.`,
      ),
    );
  }

  const bothAntisocial =
    a.antisocialTraits.length > 0 && b.antisocialTraits.length > 0;
  if (bothAntisocial) {
    score -= 5;
    explanations.push(
      explanation(
        "antisocial_adjacency",
        -5,
        `${a.name} and ${b.name} both have antisocial traits and are adjacent.`,
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
        "peer_modeling",
        3,
        `${a.name} and ${b.name} create a possible peer-modeling pairing.`,
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
    .map(([key, studentId]) => {
      const student = studentsById.get(studentId);
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
    .map(([key, studentId]) => {
      const student = studentsById.get(studentId);
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
