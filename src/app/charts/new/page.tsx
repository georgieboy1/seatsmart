import Link from "next/link";
import { redirect } from "next/navigation";
import { listStudents } from "@/lib/students/actions";
import { listCohorts } from "@/lib/cohorts/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Users } from "lucide-react";

import { SeatingChartView } from "@/components/charts/seating-chart-view";
import { getLayout, listLayouts } from "@/lib/layouts/actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ layoutId?: string; cohortId?: string }>;

export default async function NewChartPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { layoutId, cohortId } = await searchParams;
  const [layouts, cohorts] = await Promise.all([
    listLayouts(),
    listCohorts(),
  ]);

  if (layouts.length === 0) {
    redirect("/dashboard?error=Create+a+layout+first");
  }

  if (cohorts.length === 0) {
    redirect("/dashboard?error=Create+a+cohort+first");
  }

  if (layoutId && cohortId) {
    const [selectedLayout, students] = await Promise.all([
      getLayout(layoutId),
      listStudents(cohortId),
    ]);

    if (!selectedLayout) {
      redirect("/charts/new?error=Layout+not+found");
    }

    if (students.length < 2) {
      redirect(`/charts/new?layoutId=${layoutId}&error=Need+at+least+2+students+in+this+cohort`);
    }
    
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <SeatingChartView 
          layout={selectedLayout} 
          students={students} 
          cohortId={cohortId}
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
                      : `${layout.numGroups} groups of ${layout.studentsPerGroup}`}
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
          Step 2: Pick a student cohort.
        </p>
      </div>
<div className="grid gap-4 sm:grid-cols-2">
  <Link href={`/charts/new?layoutId=${layoutId}&cohortId=`}>
    <Card className="hover:bg-accent/50 transition-colors border-dashed">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Users className="h-5 w-5 text-muted-foreground opacity-50" />
        <CardTitle className="text-base">All Students (No Cohort)</CardTitle>
      </CardHeader>
    </Card>
  </Link>
  {cohorts.map((cohort) => (
...
          <Link key={cohort.id} href={`/charts/new?layoutId=${layoutId}&cohortId=${cohort.id}`}>
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
