import { beforeEach, describe, expect, it, vi } from "vitest";
import * as db from "./store";
import { loadSampleData, SAMPLE_CLASS_NAME } from "./sample";
import { deleteStudents } from "@/lib/students/actions";
import { deleteClass } from "@/lib/classes/actions";
import { updateLayout, deleteLayout } from "@/lib/layouts/actions";
import { createChart, updateChart } from "@/lib/charts/actions";

vi.mock("./nav", () => ({ go: vi.fn(), withMessage: (p: string) => p }));

const student = (name: string, cohort_id: string | null = null) => ({
  user_id: db.LOCAL_USER_ID,
  cohort_id,
  name,
  external_id: null,
  age: null,
  family_name: null,
  allergies: [],
  health_flags: [],
  prosocial_traits: [],
  antisocial_traits: [],
  constraints: [],
  together_ids: [] as string[],
  separate_ids: [] as string[],
  notes: null,
});

beforeEach(() => {
  window.localStorage.clear();
  db.__resetForTests();
});

describe("local store", () => {
  it("persists inserts to localStorage and reloads them", () => {
    const [row] = db.insert("students", [student("Ada")]);
    expect(row.id).toBeTruthy();
    expect(row.created_at).toBe(row.updated_at);

    db.__resetForTests();
    expect(db.all("students").map((s) => s.name)).toEqual(["Ada"]);
  });

  it("notifies subscribers on every write", () => {
    const listener = vi.fn();
    db.subscribe(listener);
    const [row] = db.insert("cohorts", [{ user_id: db.LOCAL_USER_ID, name: "P1" }]);
    db.update("cohorts", [row.id], { name: "P2" });
    db.remove("cohorts", [row.id]);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("returns a new snapshot object after a write and the same one otherwise", () => {
    const before = db.getSnapshot();
    expect(db.getSnapshot()).toBe(before);
    db.insert("students", [student("Ada")]);
    expect(db.getSnapshot()).not.toBe(before);
  });

  it("round-trips a backup and rejects files that aren't backups", () => {
    db.insert("students", [student("Ada"), student("Ben")]);
    const text = JSON.stringify(db.createBackup());
    db.replaceAll(db.EMPTY_TABLES);
    expect(db.all("students")).toHaveLength(0);

    db.replaceAll(db.parseBackup(text));
    expect(db.all("students").map((s) => s.name).sort()).toEqual(["Ada", "Ben"]);

    expect(() => db.parseBackup("not json")).toThrow(/isn't a SynDesk backup/);
    expect(() => db.parseBackup(JSON.stringify({ hello: 1 }))).toThrow(/isn't a SynDesk backup/);
    expect(() =>
      db.parseBackup(JSON.stringify({ format: db.BACKUP_FORMAT, version: 99, data: {} })),
    ).toThrow(/newer version/);
  });

  it("starts empty when saved data is corrupt", () => {
    window.localStorage.setItem(db.STORAGE_KEY, "{broken");
    db.__resetForTests();
    expect(db.getSnapshot()).toEqual(db.EMPTY_TABLES);
  });
});

describe("save functions on the local store", () => {
  it("flags charts stale and clears relationships when students are deleted", async () => {
    const [a, b] = db.insert("students", [student("Ada"), student("Ben")]);
    db.update("students", [b.id], { together_ids: [a.id], separate_ids: [a.id] });
    const chartId = await createChart({
      layoutId: "L",
      classId: null,
      name: "C",
      assignments: { "1,1": a.id },
      lockedSeats: {},
      score: 90,
      seed: 0,
      stale: false,
      staleReasons: [],
    });

    await deleteStudents([a.id]);

    expect(db.find("students", a.id)).toBeNull();
    expect(db.find("students", b.id)).toMatchObject({ together_ids: [], separate_ids: [] });
    expect(db.find("seating_charts", chartId)).toMatchObject({
      stale: true,
      stale_reasons: ["student was removed"],
      assignments: { "1,1": a.id },
    });
  });

  it("keeps students but unassigns them when their class is deleted", async () => {
    const [cls] = db.insert("cohorts", [{ user_id: db.LOCAL_USER_ID, name: "P1" }]);
    const [s] = db.insert("students", [student("Ada", cls.id)]);
    await deleteClass(cls.id);
    expect(db.find("cohorts", cls.id)).toBeNull();
    expect(db.find("students", s.id)?.cohort_id).toBeNull();
  });

  it("refuses to delete a layout that charts still use", async () => {
    const [layout] = db.insert("layouts", [
      {
        user_id: db.LOCAL_USER_ID,
        name: "Room",
        type: "traditional",
        rows: 1,
        columns: 1,
        num_groups: null,
        students_per_group: null,
        grid: [["seat"]],
      },
    ]);
    await createChart({
      layoutId: layout.id,
      classId: null,
      name: "C",
      assignments: {},
      lockedSeats: {},
      score: null,
      seed: 0,
      stale: false,
      staleReasons: [],
    });
    await deleteLayout(layout.id);
    expect(db.find("layouts", layout.id)).not.toBeNull();
  });

  it("marks charts stale when their layout changes", async () => {
    const [layout] = db.insert("layouts", [
      {
        user_id: db.LOCAL_USER_ID,
        name: "Room",
        type: "traditional",
        rows: 1,
        columns: 1,
        num_groups: null,
        students_per_group: null,
        grid: [["seat"]],
      },
    ]);
    const chartId = await createChart({
      layoutId: layout.id,
      classId: null,
      name: "C",
      assignments: {},
      lockedSeats: {},
      score: null,
      seed: 0,
      stale: false,
      staleReasons: [],
    });
    const form = new FormData();
    form.set("name", "Room 2");
    form.set("type", "traditional");
    form.set("rows", "1");
    form.set("columns", "1");
    form.set("grid", JSON.stringify([["seat"]]));
    await updateLayout(layout.id, form);

    expect(db.find("layouts", layout.id)?.name).toBe("Room 2");
    expect(db.find("seating_charts", chartId)).toMatchObject({
      stale: true,
      stale_reasons: ["layout was updated"],
    });
  });

  it("updates only the chart fields it is given", async () => {
    const chartId = await createChart({
      layoutId: "L",
      classId: null,
      name: "Before",
      assignments: { "1,1": "x" },
      lockedSeats: {},
      score: 50,
      seed: 0,
      stale: true,
      staleReasons: ["layout was updated"],
    });
    await updateChart(chartId, { name: "After", stale: false, staleReasons: [] });
    expect(db.find("seating_charts", chartId)).toMatchObject({
      name: "After",
      stale: false,
      stale_reasons: [],
      assignments: { "1,1": "x" },
      score: 50,
    });
  });
});

describe("sample class", () => {
  it("loads a full class with valid relationships, and reloading doesn't duplicate it", () => {
    const { classId, layoutId } = loadSampleData();
    loadSampleData();
    const students = db.all("students");
    const ids = new Set(students.map((s) => s.id));

    expect(db.all("cohorts").filter((c) => c.name === SAMPLE_CLASS_NAME)).toHaveLength(1);
    expect(db.find("layouts", layoutId)).not.toBeNull();
    expect(students).toHaveLength(24);
    expect(students.every((s) => s.cohort_id === classId)).toBe(true);
    for (const s of students) {
      for (const ref of [...s.together_ids, ...s.separate_ids]) {
        expect(ids.has(ref)).toBe(true);
      }
    }
  });
});

describe("ID format", () => {
  it("gives the sample class, layout and students IDs the forms accept", async () => {
    const { studentCreateSchema } = await import("@/lib/students/schemas");
    const { classId } = loadSampleData();
    const students = db.all("students");
    const result = studentCreateSchema.safeParse({
      name: "New Kid",
      classId,
      togetherIds: [students[0].id],
      separateIds: [students[1].id],
    });
    expect(result.success).toBe(true);
  });

  it("generates UUIDs even without crypto.randomUUID", () => {
    const original = crypto.randomUUID;
    // @ts-expect-error simulate an older browser
    delete (crypto as { randomUUID?: unknown }).randomUUID;
    try {
      const [row] = db.insert("cohorts", [{ user_id: db.LOCAL_USER_ID, name: "P1" }]);
      expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      crypto.randomUUID = original;
    }
  });
});
