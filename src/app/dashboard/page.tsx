import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listLayouts } from "@/lib/layouts/actions";
import { listStudents } from "@/lib/students/actions";
import { listCharts } from "@/lib/charts/actions";
import { listCohorts, createCohort } from "@/lib/cohorts/actions";
import { logout } from "./actions";
import { LayoutGrid, Users, ClipboardList, Plus, LogOut, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error: errorMsg, success: successMsg } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [layouts, students, charts, cohorts] = await Promise.all([
    listLayouts(),
    listStudents(),
    listCharts(),
    listCohorts(),
  ]);

  const canGenerate = layouts.length > 0 && students.length >= 2;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {errorMsg && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-800 border border-green-200">
          {successMsg}
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </form>
      </div>

      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <Link href="/layouts" className="transition-transform hover:scale-[1.01]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Classroom Layouts</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{layouts.length}</div>
              <p className="text-xs text-muted-foreground">
                Model your physical rooms
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/students" className="transition-transform hover:scale-[1.01]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                Manage your roster and traits
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/charts" className="transition-transform hover:scale-[1.01]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Recent Charts</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{charts.length}</div>
              <p className="text-xs text-muted-foreground">
                Optimized seating assignments
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mb-12 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cohorts</CardTitle>
            <div className="flex gap-2">
              <Link href="/cohorts" className="text-xs text-primary hover:underline">Manage</Link>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohorts.length}</div>
            <p className="text-xs text-muted-foreground mb-4">
              Groups like Class 1A or FAMU
            </p>
            <form action={createCohort} className="flex gap-2">
              <Input name="name" placeholder="New cohort name..." required className="h-8 text-xs" />
              <Button type="submit" size="sm" className="h-8 text-xs">Add</Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-card">
          <h2 className="mb-1 text-lg font-semibold">Ready to seat?</h2>
          <p className="mb-4 max-w-sm text-xs text-muted-foreground">
            {!canGenerate 
              ? "Need at least one layout, one cohort, and two students."
              : "Pick a layout and cohort to generate assignments."}
          </p>
          <Button asChild size="sm" disabled={!canGenerate}>
            <Link href={canGenerate ? "/charts/new" : "#"}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Chart
            </Link>
          </Button>
        </div>
      </div>

      {charts.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-medium">Recent Charts</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {charts.slice(0, 3).map((chart) => (
              <Link key={chart.id} href={`/charts/${chart.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">{chart.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(chart.updatedAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
