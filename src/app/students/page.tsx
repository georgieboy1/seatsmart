import { listStudents } from "@/lib/students/actions";
import { StudentsRoster } from "./students-roster";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, success } = await searchParams;
  const students = await listStudents();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">
          {students.length === 0
            ? "Build your roster before generating a chart."
            : `${students.length} student${students.length === 1 ? "" : "s"}`}
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

      <StudentsRoster students={students} />
    </main>
  );
}
