"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "./store";
import { rowToStudent } from "@/lib/students/db";
import { rowToClass } from "@/lib/classes/db";
import { rowToLayout } from "@/lib/layouts/db";
import { rowToChart } from "@/lib/charts/db";
import type { Student } from "@/lib/types/student";
import type { Class } from "@/lib/types/class";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { SeatingChart } from "@/lib/types/chart";

function useTables() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};

/**
 * False during the static prerender and the first client render, true once
 * the browser's saved data has been read. Pages use it to avoid treating
 * "not loaded yet" as "doesn't exist" (e.g. redirecting away from a chart
 * that's about to appear).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

const byUpdatedDesc = <T extends { updatedAt: string }>(a: T, b: T) =>
  b.updatedAt.localeCompare(a.updatedAt);

export function useStudents(classId?: string | null): Student[] {
  const { students } = useTables();
  return useMemo(() => {
    const mapped = students.map(rowToStudent).sort(byName);
    return classId ? mapped.filter((s) => s.classId === classId) : mapped;
  }, [students, classId]);
}

export function useClasses(): Class[] {
  const { cohorts } = useTables();
  return useMemo(() => cohorts.map(rowToClass).sort(byName), [cohorts]);
}

export function useLayouts(): ClassroomLayout[] {
  const { layouts } = useTables();
  return useMemo(() => layouts.map(rowToLayout).sort(byUpdatedDesc), [layouts]);
}

export function useLayout(id: string | null): ClassroomLayout | null {
  const layouts = useLayouts();
  return useMemo(() => layouts.find((l) => l.id === id) ?? null, [layouts, id]);
}

export function useCharts(): SeatingChart[] {
  const { seating_charts } = useTables();
  return useMemo(() => seating_charts.map(rowToChart).sort(byUpdatedDesc), [seating_charts]);
}

export function useChart(id: string | null): SeatingChart | null {
  const charts = useCharts();
  return useMemo(() => charts.find((c) => c.id === id) ?? null, [charts, id]);
}
