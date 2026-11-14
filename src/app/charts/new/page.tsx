"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useClasses, useHydrated, useLayouts, useStudents } from "@/lib/local/hooks";
import { FlashMessages } from "@/components/local/flash-messages";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Users } from "lucide-react";

import { SeatingChartView } from "@/components/charts/seating-chart-view";
function Blocked({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="border-[1.5px] border-dashed p-12 text-center">
        <p className="text-base font-medium">{message}</p>
        <Button asChild className="mt-4">
          <Link href={href}>{cta}</Link>
        </Button>
      </div>
    </main>
  );
}

function NewChart() {
  const params = useSearchParams();
  const layoutId = params.get("layoutId") ?? undefined;
  const classIdParam = params.get("classId");
  const classId = classIdParam === null ? undefined : classIdParam;
  const hydrated = useHydrated();
  const layouts = useLayouts();
  const classes = useClasses();
  const students = useStudents();

  if (!hydrated) return null;

  if (layouts.length === 0) {
    return <Blocked message="Draw your classroom first." href="/layouts" cta="Create a layout" />;
  }

  if (students.length < 2) {
    return <Blocked message="Add at least two students first." href="/students" cta="Add students" />;
  }

  if (layoutId && classId !== undefined) {
    const selectedLayout = layouts.find((l) => l.id === layoutId);

    if (!selectedLayout) {
      return <Blocked message="That layout wasn't found." href="/charts/new" cta="Pick a layout" />;
    }

    const cohortStudents = students.filter((s) => s.classId === (classId || null));
    if (cohortStudents.length < 2 && classId !== "") {
      return (
        <Blocked
          message="This class needs at least 2 students."
          href={`/charts/new?layoutId=${layoutId}`}
          cta="Pick another class"
        />
      );
    }

    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <SeatingChartView 
          layout={selectedLayout} 
          students={students} 
          classes={classes}
          classId={classId || undefined}
        />
      </main>
    );
  }

  if (!layoutId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">New Seating Chart</h1>
          <p className="text-sm text-muted-foreground">
            Step 1: Pick a classroom layout.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {layouts.map((layout) => (
            <Link key={layout.id} href={`/charts/new?layoutId=${layout.id}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{layout.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {layout.type === "traditional"
                      ? `${layout.rows} × ${layout.columns} grid`
                      : `${layout.numGroups} groups of ${layout.studentsPerGroup} students`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="mt-8">
          <Button asChild variant="ghost">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">New Seating Chart</h1>
        <p className="text-sm text-muted-foreground">
          Step 2: Pick a class roster.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/charts/new?layoutId=${layoutId}&classId=`}>
          <Card className="hover:bg-accent/50 transition-colors border-dashed">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Users className="h-5 w-5 text-muted-foreground opacity-50" />
              <CardTitle className="text-base">All Students (No Class)</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        {classes.map((cohort) => (
          <Link key={cohort.id} href={`/charts/new?layoutId=${layoutId}&classId=${cohort.id}`}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{cohort.name}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      
      <div className="mt-8">
        <Button asChild variant="ghost">
          <Link href="/charts/new">← Back to Layout Selection</Link>
        </Button>
      </div>
    </main>
  );
}

export default function NewChartPage() {
  return (
    <Suspense fallback={null}>
      <FlashMessages />
      <NewChart />
    </Suspense>
  );
}
