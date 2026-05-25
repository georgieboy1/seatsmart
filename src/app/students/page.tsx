import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listStudents } from "@/lib/students/actions";
import { StudentsList } from "./students-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const students = await listStudents();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            {students.length === 0
              ? "Build your roster before generating a chart."
              : `${students.length} student${students.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled title="Add/edit modal lands in Commit 3.4">
            Add student
          </Button>
          <Button disabled variant="outline" title="CSV import lands in Commit 3.6">
            Import CSV
          </Button>
          <Button disabled variant="outline" title="CSV export lands in Commit 3.7">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          aria-label="Search students"
          disabled
          placeholder="Search students (coming with table actions)"
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <StudentsList students={students} />
    </main>
  );
}
