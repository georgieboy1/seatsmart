import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listCohorts, updateCohort, deleteCohort } from "@/lib/cohorts/actions";
import { listAttendees } from "@/lib/attendees/actions";
import { ChevronLeft, Trash2, Save, Users } from "lucide-react";
import { getProfile } from "@/lib/attendees/profile";
import { getTerminology } from "@/lib/utils/terminology";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function CohortsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error: errorMsg, success: successMsg } = await searchParams;
  const profile = await getProfile();
  const t = getTerminology(profile?.workspaceType ?? "education");

  const [cohorts, attendees] = await Promise.all([
    listCohorts(),
    listAttendees(),
  ]);

  const attendeesByCohort = attendees.reduce((acc, attendee) => {
    const cohortId = attendee.cohortId || "unassigned";
    if (!acc[cohortId]) acc[cohortId] = [];
    acc[cohortId].push(attendee);
    return acc;
  }, {} as Record<string, typeof attendees>);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Manage {t.groups}</h1>
          <p className="text-sm text-muted-foreground">
            Rename or delete your {t.person.toLowerCase()} groups.
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

      <div className="grid gap-6">
        {cohorts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No {t.groups.toLowerCase()} found. Create one on the dashboard.
            </CardContent>
          </Card>
        ) : (
          cohorts.map((cohort) => (
            <Card key={cohort.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <form 
                  action={updateCohort.bind(null, cohort.id)} 
                  className="flex flex-1 gap-2"
                >
                  <Input 
                    name="name" 
                    defaultValue={cohort.name} 
                    required 
                    className="flex-1 font-semibold text-lg"
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
                    title={`Delete ${t.group.toLowerCase()}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <Users className="h-4 w-4" />
                    {t.people} ({attendeesByCohort[cohort.id]?.length || 0})
                  </div>
                  {attendeesByCohort[cohort.id] && attendeesByCohort[cohort.id].length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {attendeesByCohort[cohort.id].map((attendee) => (
                        <div 
                          key={attendee.id} 
                          className="text-sm border rounded-md px-3 py-2 bg-muted/30 flex items-center justify-between"
                        >
                          {attendee.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      No {t.people.toLowerCase()} assigned to this {t.group.toLowerCase()}.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {attendeesByCohort["unassigned"] && attendeesByCohort["unassigned"].length > 0 && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg opacity-50">Unassigned {t.people}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {attendeesByCohort["unassigned"].map((attendee) => (
                  <div 
                    key={attendee.id} 
                    className="text-sm border rounded-md px-3 py-2 bg-muted/10 flex items-center justify-between"
                  >
                    {attendee.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
