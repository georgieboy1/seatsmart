/**
 * A ready-made class so a teacher can see SynDesk work in one click,
 * before typing a single name. Every name here is invented.
 */
import { createTraditionalGrid } from "@/lib/layouts/grid";
import type { StudentRow } from "@/lib/students/db";
import type { Tables } from "./store";
import { LOCAL_USER_ID, getSnapshot, replaceAll } from "./store";
import type { DietaryAccessibility, AntisocialTrait, ProsocialTrait } from "@/lib/students/constants";

export const SAMPLE_CLASS_NAME = "Sample class · Period 2";
export const SAMPLE_LAYOUT_NAME = "Sample room · 5 × 6 rows";

type SampleStudent = {
  name: string;
  constraints?: DietaryAccessibility[];
  prosocial?: ProsocialTrait[];
  antisocial?: AntisocialTrait[];
  together?: string[];
  separate?: string[];
};

const ROSTER: SampleStudent[] = [
  { name: "Amara Okafor", prosocial: ["helpful", "leader"] },
  { name: "Ben Carter", antisocial: ["talkative"], separate: ["Leo Martins"] },
  { name: "Chloe Nguyen", constraints: ["vision_front"], prosocial: ["focused"] },
  { name: "Dev Patel", prosocial: ["calm"] },
  { name: "Elena Rossi", antisocial: ["distracted"] },
  { name: "Farah Haddad", constraints: ["hearing_left"] },
  { name: "Gabe Thompson", antisocial: ["restless"], constraints: ["near_door"] },
  { name: "Hana Sato", prosocial: ["encouraging"], together: ["Isla Brown"] },
  { name: "Isla Brown", antisocial: ["withdrawn"] },
  { name: "Jamal Wright", prosocial: ["responsible"] },
  { name: "Kai Fernandes", antisocial: ["disruptive"], separate: ["Ben Carter"] },
  { name: "Leo Martins", antisocial: ["talkative"] },
  { name: "Maya Johnson", constraints: ["near_teacher"], prosocial: ["focused"] },
  { name: "Noah Kim" },
  { name: "Olivia Mensah", prosocial: ["helpful"], together: ["Gabe Thompson"] },
  { name: "Priya Shah", constraints: ["front_of_room"] },
  { name: "Quinn Murphy", antisocial: ["off_task"] },
  { name: "Rosa Alvarez", prosocial: ["calm", "encouraging"] },
  { name: "Sam Lee" },
  { name: "Tariq Hassan", antisocial: ["restless"], separate: ["Quinn Murphy"] },
  { name: "Uma Reddy", prosocial: ["leader"] },
  { name: "Victor Dubois", constraints: ["away_from_window"] },
  { name: "Wren Clarke", prosocial: ["responsible"] },
  { name: "Yusuf Ali", antisocial: ["talkative"] },
];

function buildSample(): Tables {
  const stamp = new Date().toISOString();
  // Fixed, valid UUIDs so the sample works with the forms' ID validation and
  // loading it twice replaces it instead of duplicating it.
  const uuid = (n: number) => `5a3b1e00-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
  const classId = uuid(1);
  const layoutId = uuid(2);

  const grid = createTraditionalGrid(5, 6);
  grid[2][0] = "door";
  grid[3][grid[0].length - 1] = "window";
  grid[0][3] = "whiteboard";
  grid[4][0] = "charging_station";

  const index = new Map(ROSTER.map((s, i) => [s.name, i]));
  const idFor = (name: string) => {
    const i = index.get(name);
    if (i === undefined) throw new Error(`Sample roster references unknown student "${name}"`);
    return uuid(0x100 + i);
  };

  const students: StudentRow[] = ROSTER.map((s) => ({
    id: idFor(s.name),
    user_id: LOCAL_USER_ID,
    cohort_id: classId,
    name: s.name,
    external_id: null,
    age: null,
    family_name: null,
    allergies: [],
    health_flags: [],
    prosocial_traits: s.prosocial ?? [],
    antisocial_traits: s.antisocial ?? [],
    constraints: s.constraints ?? [],
    together_ids: (s.together ?? []).map(idFor),
    separate_ids: (s.separate ?? []).map(idFor),
    notes: null,
    created_at: stamp,
    updated_at: stamp,
  }));

  return {
    cohorts: [{ id: classId, user_id: LOCAL_USER_ID, name: SAMPLE_CLASS_NAME, created_at: stamp, updated_at: stamp }],
    layouts: [
      {
        id: layoutId,
        user_id: LOCAL_USER_ID,
        name: SAMPLE_LAYOUT_NAME,
        type: "traditional",
        rows: 5,
        columns: 6,
        num_groups: null,
        students_per_group: null,
        grid,
        created_at: stamp,
        updated_at: stamp,
      },
    ],
    students,
    seating_charts: [],
  };
}

/** Adds the sample class alongside anything already saved. Returns its ids. */
export function loadSampleData(): { classId: string; layoutId: string } {
  const sample = buildSample();
  const current = getSnapshot();
  const sampleIds = new Set([
    ...sample.students.map((s) => s.id),
    ...sample.cohorts.map((c) => c.id),
    ...sample.layouts.map((l) => l.id),
  ]);
  const keep = <T extends { id: string }>(rows: T[]) => rows.filter((r) => !sampleIds.has(r.id));
  replaceAll({
    students: [...keep(current.students), ...sample.students],
    cohorts: [...keep(current.cohorts), ...sample.cohorts],
    layouts: [...keep(current.layouts), ...sample.layouts],
    seating_charts: current.seating_charts,
  });
  return { classId: sample.cohorts[0].id, layoutId: sample.layouts[0].id };
}
