"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useChart, useClasses, useHydrated, useLayout, useStudents } from "@/lib/local/hooks";
import { SeatingChartView } from "@/components/charts/seating-chart-view";

function NotFound({ title }: { title: string }) {
  return (
    <div className="border-[1.5px] border-dashed p-12 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been deleted, or it was saved in a different browser.
      </p>
      <Link href="/charts" className="mt-4 inline-block text-sm underline">
        Back to charts
      </Link>
    </div>
  );
}

function ChartDetail() {
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const chart = useChart(id);
  const layout = useLayout(chart?.layoutId ?? null);
  const students = useStudents();
  const classes = useClasses();

  if (!hydrated) return null;
  if (!chart) return <NotFound title="Chart not found" />;
  if (!layout) return <NotFound title="This chart's classroom layout was deleted" />;

  return (
    <SeatingChartView
      key={chart.id}
      layout={layout}
      students={students}
      classes={classes}
      initialChart={chart}
    />
  );
}

export default function ChartDetailPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Suspense fallback={null}>
        <ChartDetail />
      </Suspense>
    </main>
  );
}
