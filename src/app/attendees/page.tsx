import { listAttendees } from "@/lib/attendees/actions";
import { listCohorts } from "@/lib/cohorts/actions";
import { AttendeesRoster } from "./attendees-roster";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, success } = await searchParams;
  const [attendees, cohorts] = await Promise.all([
    listAttendees(),
    listCohorts(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Attendees</h1>
        <p className="text-sm text-muted-foreground">
          {attendees.length === 0
            ? "Build your attendee list before generating a chart."
            : `${attendees.length} attendee${attendees.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-4 text-sm text-emerald-700" role="status">
          {success}
        </p>
      )}

      <AttendeesRoster attendees={attendees} cohorts={cohorts} />
    </main>
  );
}
