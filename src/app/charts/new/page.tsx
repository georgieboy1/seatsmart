import Link from "next/link";
import { redirect } from "next/navigation";
import { listStudents } from "@/lib/students/actions";
import { listClasses } from "@/lib/classes/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Users } from "lucide-react";

import { SeatingChartView } from "@/components/charts/seating-chart-view";
import { getLayout, listLayouts } from "@/lib/layouts/actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ layoutId?: string; classId?: string }>;

export default async function NewChartPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { layoutId, classId } = await searchParams;
  const [layouts, classes] = await Promise.all([
    listLayouts(),
    listClasses(),
  ]);

  if (layouts.length === 0) {
    redirect("/dashboard?error=Create+a+layout+first");
  }

  if (classes.length === 0) {
    redirect("/dashboard?error=Create+a+class+first");
  }

  if (layoutId && classId !== undefined) {
    const [selectedLayout, students, allClasss] = await Promise.all([
      getLayout(layoutId),
      listStudents(), // Get all students so we can filter in the view
      listClasses(),
    ]);

    if (!selectedLayout) {
      redirect("/charts/new?error=Layout+not+found");
    }

    // Still check if the specific cohort has enough students for initial generation
    const cohortStudents = students.filter(s => s.classId === (classId || null));
    if (cohortStudents.length < 2 && classId !== "") {
      redirect(`/charts/new?layoutId=${layoutId}&error=Need+at+least+2+students+in+this+class`);
    }
    
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <SeatingChartView 
          layout={selectedLayout} 
          students={students} 
          classes={allClasss}
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
