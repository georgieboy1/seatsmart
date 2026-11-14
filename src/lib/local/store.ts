import { validateBackupData } from "./backup-validation";
/**
 * SynDesk's on-device database.
 *
 * Everything a teacher enters (classes, students, layouts, charts) lives in
 * this browser's localStorage and nowhere else. There is no server, account
 * or sync. The row shapes deliberately match the old Supabase tables so the
 * existing row<->model mappers in lib/{students,classes,layouts,charts}/db.ts
 * keep working unchanged.
 *
 * React reads through useSyncExternalStore (see ./hooks.ts), so every write
 * here re-renders whatever is on screen, and a write in one tab reaches the
 * others through the browser's `storage` event.
 */
import type { StudentRow } from "@/lib/students/db";
import type { ClassRow } from "@/lib/classes/db";
import type { LayoutRow } from "@/lib/layouts/db";
import type { ChartRow } from "@/lib/charts/db";

export const LOCAL_USER_ID = "local";
export const STORAGE_KEY = "syndesk:data:v1";
export const BACKUP_FORMAT = "syndesk-backup";
export const BACKUP_VERSION = 1;

export type Tables = {
  students: StudentRow[];
  cohorts: ClassRow[];
  layouts: LayoutRow[];
  seating_charts: ChartRow[];
};

export type TableName = keyof Tables;
type RowOf<T extends TableName> = Tables[T][number];
type InsertOf<T extends TableName> = Omit<RowOf<T>, "id" | "created_at" | "updated_at">;

export const EMPTY_TABLES: Tables = Object.freeze({
  students: [],
  cohorts: [],
  layouts: [],
  seating_charts: [],
}) as Tables;

let state: Tables = EMPTY_TABLES;
let loaded = false;
const listeners = new Set<() => void>();

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function normalize(raw: unknown): Tables {
  const source = (raw && typeof raw === "object" ? raw : {}) as Partial<Tables>;
  return {
    students: Array.isArray(source.students) ? source.students : [],
    cohorts: Array.isArray(source.cohorts) ? source.cohorts : [],
    layouts: Array.isArray(source.layouts) ? source.layouts : [],
    seating_charts: Array.isArray(source.seating_charts) ? source.seating_charts : [],
  };
}

function readStorage(): Tables {
  if (!hasStorage()) return EMPTY_TABLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : EMPTY_TABLES;
  } catch {
    return EMPTY_TABLES;
  }
}

function ensureLoaded() {
  if (loaded || !hasStorage()) return;
  loaded = true;
  state = readStorage();
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = readStorage();
    emit();
  });
}

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(next: Tables) {
  state = next;
  if (hasStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded or storage blocked: keep working in memory so the
      // teacher doesn't lose the screen they're on. The dashboard warns
      // about this and offers a backup download.
      storageFailed = true;
    }
  }
  emit();
}

let storageFailed = false;

export function storageIsWorking(): boolean {
  return hasStorage() && !storageFailed;
}

export function subscribe(listener: () => void): () => void {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Tables {
  ensureLoaded();
  return state;
}

export function getServerSnapshot(): Tables {
  return EMPTY_TABLES;
}

function now() {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 shape, so IDs pass the same validation as randomUUID().
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function all<T extends TableName>(table: T): Tables[T] {
  return getSnapshot()[table];
}

export function find<T extends TableName>(table: T, id: string): RowOf<T> | null {
  return (all(table) as RowOf<T>[]).find((row) => row.id === id) ?? null;
}

export function insert<T extends TableName>(table: T, values: InsertOf<T>[]): RowOf<T>[] {
  const stamp = now();
  const rows = values.map(
    (value) => ({ ...value, id: newId(), created_at: stamp, updated_at: stamp }) as RowOf<T>,
  );
  const current = getSnapshot();
  commit({ ...current, [table]: [...current[table], ...rows] });
  return rows;
}

export function update<T extends TableName>(
  table: T,
  ids: string[],
  patch: Partial<RowOf<T>> | ((row: RowOf<T>) => Partial<RowOf<T>>),
): void {
  const idSet = new Set(ids);
  const stamp = now();
  const current = getSnapshot();
  const next = (current[table] as RowOf<T>[]).map((row) => {
    if (!idSet.has(row.id)) return row;
    const changes = typeof patch === "function" ? patch(row) : patch;
    return { ...row, ...changes, id: row.id, updated_at: stamp };
  });
  commit({ ...current, [table]: next });
}

export function remove<T extends TableName>(table: T, ids: string[]): void {
  const idSet = new Set(ids);
  const current = getSnapshot();
  commit({
    ...current,
    [table]: (current[table] as RowOf<T>[]).filter((row) => !idSet.has(row.id)),
  });
}

/** Replace everything at once (backup restore, sample data, reset). */
export function replaceAll(next: Tables): void {
  commit(normalize(next));
}

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: Tables;
};

export function createBackup(): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now(),
    data: getSnapshot(),
  };
}

export function parseBackup(text: string): Tables {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a SynDesk backup (it isn't valid JSON).");
  }
  const backup = parsed as Partial<Backup>;
  if (backup?.format !== BACKUP_FORMAT || typeof backup.version !== "number") {
    throw new Error("That file isn't a SynDesk backup.");
  }
  if (backup.version > BACKUP_VERSION) {
    throw new Error("This backup was made by a newer version of SynDesk. Reload the page and try again.");
  }
  if (backup.version !== BACKUP_VERSION) {
    throw new Error("This backup version is not supported. Nothing was restored.");
  }
  if (typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt))) {
    throw new Error("This backup has an invalid or missing export date. Nothing was restored.");
  }
  return validateBackupData(backup.data);
}

/** Test helper: forget the in-memory copy so the next read hits storage. */
export function __resetForTests(): void {
  state = EMPTY_TABLES;
  loaded = false;
  storageFailed = false;
  listeners.clear();
}
