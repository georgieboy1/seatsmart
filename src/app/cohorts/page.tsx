import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listCohorts, updateCohort, deleteCohort } from "@/lib/cohorts/actions";
import { ChevronLeft, Trash2, Save } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function CohortsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error: errorMsg, success: successMsg } = await searchParams;
  const cohorts = await listCohorts();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Manage Cohorts</h1>
          <p className="text-sm text-muted-foreground">
            Rename or delete your student groups.
          </p>
        </div>
      </div>

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

      <div className="grid gap-4">
        {cohorts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No cohorts found. Create one on the dashboard.
            </CardContent>
          </Card>
        ) : (
          cohorts.map((cohort) => (
            <Card key={cohort.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <form 
                  action={updateCohort.bind(null, cohort.id)} 
                  className="flex flex-1 gap-2"
                >
                  <Input 
                    name="name" 
                    defaultValue={cohort.name} 
                    required 
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" variant="outline" title="Save name">
                    <Save className="h-4 w-4" />
                  </Button>
                </form>
                <form action={deleteCohort.bind(null, cohort.id)}>
                  <Button 
                    type="submit" 
                    size="icon" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete cohort"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
