/* eslint-disable @typescript-eslint/no-explicit-any -- malformed synthetic JSON fixtures */
import { beforeEach, expect, it } from "vitest";
import { __resetForTests, createBackup, getSnapshot, parseBackup, replaceAll, STORAGE_KEY } from "./store";
import { loadSampleData } from "./sample";
beforeEach(() => { localStorage.clear(); __resetForTests(); loadSampleData(); });
it("round-trips the complete synthetic sample without changes", () => {
  const backup = createBackup();
  expect(parseBackup(JSON.stringify(backup))).toEqual(backup.data);
});
it.each([
  ["absent data", (b: any) => { delete b.data; }],
  ["absent table", (b: any) => { delete b.data.layouts; }],
  ["null table", (b: any) => { b.data.students = null; }],
  ["bad row", (b: any) => { b.data.students = [{ id: "broken" }]; }],
  ["missing name", (b: any) => { delete b.data.students[0].name; }],
  ["bad field type", (b: any) => { b.data.students[0].notes = 5; }],
  ["bad trait", (b: any) => { b.data.students[0].constraints = ["unknown"]; }],
  ["bad ID", (b: any) => { b.data.students[0].id = "broken"; }],
  ["duplicate ID", (b: any) => { b.data.students.push(b.data.students[0]); }],
  ["missing peer", (b: any) => { b.data.students[0].together_ids = ["00000000-0000-4000-8000-000000000099"]; }],
  ["missing class", (b: any) => { b.data.cohorts = []; }],
  ["missing export date", (b: any) => { delete b.exportedAt; }],
  ["old version", (b: any) => { b.version = 0; }],
  ["fractional version", (b: any) => { b.version = 0.5; }],
  ["new version", (b: any) => { b.version = 2; }],
])("rejects %s without altering saved or in-memory data", (_name, mutate) => {
  const backup = JSON.parse(JSON.stringify(createBackup()));
  const before = JSON.stringify(getSnapshot());
  const persisted = localStorage.getItem(STORAGE_KEY);
  mutate(backup);
  expect(() => replaceAll(parseBackup(JSON.stringify(backup)))).toThrow();
  expect(JSON.stringify(getSnapshot())).toBe(before);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(persisted);
});
it("accepts an intentionally empty but complete backup", () => {
  const backup = createBackup();
  backup.data = {students: [], cohorts: [], layouts: [], seating_charts: []};
  expect(parseBackup(JSON.stringify(backup))).toEqual(backup.data);
});
it("validates chart references, coordinates, and duplicate placements", () => {
  const backup = createBackup();
  const layout = backup.data.layouts[0], student = backup.data.students[0];
  const row = {id: "00000000-0000-4000-8000-000000000099", user_id: "local", name: "Synthetic chart", created_at: backup.exportedAt, updated_at: backup.exportedAt,
    layout_id: layout.id, cohort_id: backup.data.cohorts[0].id, assignments: {"1,1":student.id}, locked_seats: {}, score: 0, seed: 0, stale: false, stale_reasons: []};
  backup.data = {...backup.data, seating_charts: [row]};
  expect(parseBackup(JSON.stringify(backup))).toEqual(backup.data);
  for (const patch of [
    {layout_id: "00000000-0000-4000-8000-000000000098"},
    {assignments: {"bad-coordinate": student.id}},
    {assignments: {"1,1": student.id, "1,2": student.id}},
    {assignments: {"1,1": "00000000-0000-4000-8000-000000000098"}},
  ]) {
    const bad = {...backup, data: {...backup.data, seating_charts: [{...row, ...patch}]}};
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
  }
});
