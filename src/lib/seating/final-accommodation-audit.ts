import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import type { SeatingIssue } from "./types";
import { getSeatCandidates, parsePositionKey } from "./geometry";
import { scoreConstraintsFit } from "./scoring";

/** Check every final seat, including locked/anchor placements, one rule at a
 * time. A positive preference must not cancel a separate unmet accommodation.
 * This uses existing rule semantics; it is not a comprehensive safety check. */
export function finalAccommodationIssues(students: Student[], layout: ClassroomLayout, assignments: Record<string,string>, enabled: boolean): SeatingIssue[] {
  if (!enabled) return [];
  const byId = new Map(students.map(student => [student.id,student]));
  const validSeats = new Set(getSeatCandidates(layout).map(seat => seat.key));
  const issues: SeatingIssue[] = [];
  for (const [key,id] of Object.entries(assignments)) {
    const student = byId.get(id);
    if (!student || !validSeats.has(key)) continue;
    for (const item of scoreConstraintsFit(student,layout,parsePositionKey(key)).explanations) {
      if (item.weight < 0) issues.push({severity:"warning", message:`Final placement needs review (${item.rule.replaceAll("_", " ")}): ${item.reason}`,externalIds:[id]});
    }
  }
  return issues;
}
