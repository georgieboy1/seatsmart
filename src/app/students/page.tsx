import { listStudents } from "@/lib/students/actions";
import { listClasses } from "@/lib/classes/actions";
import { StudentRoster } from "./student-roster";
import { getTerminology } from "@/lib/utils/terminology";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, success } = await searchParams;
  const [students, classes] = await Promise.all([
    listStudents(),
    listClasses(),
  ]);

  const t = getTerminology();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t.people}</h1>
        <p className="text-sm text-muted-foreground">
          {students.length === 0
            ? `Build your ${t.person.toLowerCase()} list before generating a chart.`
            : `${students.length} ${students.length === 1 ? t.person.toLowerCase() : t.people.toLowerCase()}`}
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

      <StudentRoster students={students} classes={classes} />
    </main>
  );
}
