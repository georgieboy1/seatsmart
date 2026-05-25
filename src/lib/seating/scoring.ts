import type { CellType, ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import type { DietaryAccessibility } from "@/lib/attendees/constants";
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

const CONSTRAINT_LABELS: Record<DietaryAccessibility, string> = {
  near_door: "near the entrance",
  near_teacher: "near the lead station",
  away_from_window: "away from windows",
  near_charging: "near power",
  front_of_room: "front row",
  hearing_left: "left side support",
  hearing_right: "right side support",
  vision_front: "front vision support",
  vegan: "vegan dietary needs",
  vegetarian: "vegetarian dietary needs",
  "gluten-free": "gluten-free dietary needs",
  "nut-allergy": "nut-free environment",
  "dairy-free": "dairy-free dietary needs",
  "wheelchair-access": "wheelchair accessibility",
  "low-hearing": "hearing support",
  "service-animal": "service animal space",
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
  attendee: Attendee,
  layout: ClassroomLayout,
  position: SeatPosition,
): ScoreResult {
  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (const constraint of attendee.constraints) {
    if (constraint === "front_of_room" || constraint === "vision_front") {
      const weight = isFrontOfRoom(position) ? 30 : -30;
      score += weight;
      explanations.push(
        explanation(
          constraint,
          weight,
          isFrontOfRoom(position)
            ? `${attendee.name} is placed at the front.`
            : `${attendee.name} is not at the front.`,
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
            ? `${attendee.name} is seated on the ${side} side.`
            : `${attendee.name} is not seated on the ${side} side.`,
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
          `No ${feature.replaceAll("_", " ")} is present for ${attendee.name}'s ${CONSTRAINT_LABELS[constraint as DietaryAccessibility]} constraint.`,
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
          ? `${attendee.name} is ${distance} cell${distance === 1 ? "" : "s"} from the nearest window.`
          : `${attendee.name} is ${distance} cell${distance === 1 ? "" : "s"} from ${CONSTRAINT_LABELS[constraint as DietaryAccessibility]}.`,
      ),
    );
  }

  return { score, explanations };
}

export function scoreRelationshipPair(
  a: Attendee,
  aPosition: SeatPosition,
  b: Attendee,
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
        `${a.name} and ${b.name} are requested to be together and are adjacent.`,
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
        `${a.name} and ${b.name} must be separate but are adjacent.`,
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
  attendees: Attendee[],
  assignments: Record<string, string>,
): ScoreResult {
  const attendeesById = new Map(attendees.map((attendee) => [attendee.id, attendee]));
  const placed = Object.entries(assignments)
    .map(([key, externalId]) => {
      const attendee = attendeesById.get(externalId);
      return attendee ? { key, attendee, position: parsePositionKey(key) } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  let score = 0;
  const explanations: SeatExplanation[] = [];

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const pairScore = scoreRelationshipPair(
        placed[i].attendee,
        placed[i].position,
        placed[j].attendee,
        placed[j].position,
      );
      score += pairScore.score;
      explanations.push(...pairScore.explanations);
    }
  }

  return { score, explanations };
}

export function explainAssignments(
  attendees: Attendee[],
  assignments: Record<string, string>,
): Record<string, SeatExplanation[]> {
  const attendeesById = new Map(attendees.map((attendee) => [attendee.id, attendee]));
  const explanations: Record<string, SeatExplanation[]> = {};
  const placed = Object.entries(assignments)
    .map(([key, externalId]) => {
      const attendee = attendeesById.get(externalId);
      return attendee ? { key, attendee, position: parsePositionKey(key) } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  for (const { key } of placed) {
    explanations[key] = [];
  }

  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const pairScore = scoreRelationshipPair(
        placed[i].attendee,
        placed[i].position,
        placed[j].attendee,
        placed[j].position,
      );

      if (pairScore.explanations.length === 0) continue;

      explanations[placed[i].key].push(...pairScore.explanations);
      explanations[placed[j].key].push(...pairScore.explanations);
    }
  }

  return explanations;
}
