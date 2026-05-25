import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types/student";
import {
  ACCOMMODATIONS,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "@/lib/students/constants";

const prosocialLabels = new Map(
  PROSOCIAL_TRAITS.map((trait) => [trait.value, trait.label]),
);
const antisocialLabels = new Map(
  ANTISOCIAL_TRAITS.map((trait) => [trait.value, trait.label]),
);
const accommodationLabels = new Map(
  ACCOMMODATIONS.map((item) => [item.value, item.label]),
);

function ChipList({
  values,
  labels,
}: {
  values: string[];
  labels: Map<string, string>;
}) {
  if (values.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-sm border bg-muted px-2 py-0.5 text-xs"
        >
          {labels.get(value) ?? value}
        </span>
      ))}
    </div>
  );
}

function RelatedStudents({
  ids,
  studentsById,
}: {
  ids: string[];
  studentsById: Map<string, Student>;
}) {
  if (ids.length === 0) {
    return <span className="text-muted-foreground">0</span>;
  }

  const names = ids.map((id) => studentsById.get(id)?.name ?? "Unknown student");

  return (
    <span title={names.join(", ")} aria-label={`${ids.length}: ${names.join(", ")}`}>
      {ids.length}
    </span>
  );
}

export function StudentsList({
  students,
  onEdit,
}: {
  students: Student[];
  onEdit?: (student: Student) => void;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-base font-medium">No students yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first student in the next step, then build the rest of your
          roster from the table.
        </p>
      </div>
    );
  }

  const studentsById = new Map(students.map((student) => [student.id, student]));

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-3 font-medium">Name</th>
            <th className="px-3 py-3 font-medium">Prosocial</th>
            <th className="px-3 py-3 font-medium">Antisocial</th>
            <th className="px-3 py-3 font-medium">Accommodations</th>
            <th className="px-3 py-3 font-medium">Peer tutors</th>
            <th className="px-3 py-3 font-medium">Avoid</th>
            <th className="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b last:border-b-0">
              <td className="px-3 py-3 font-medium">{student.name}</td>
              <td className="px-3 py-3 align-top">
                <ChipList
                  values={student.prosocialTraits}
                  labels={prosocialLabels}
                />
              </td>
              <td className="px-3 py-3 align-top">
                <ChipList
                  values={student.antisocialTraits}
                  labels={antisocialLabels}
                />
              </td>
              <td className="px-3 py-3 align-top">
                <ChipList
                  values={student.accommodations}
                  labels={accommodationLabels}
                />
              </td>
              <td className="px-3 py-3 align-top">
                <RelatedStudents
                  ids={student.peerTutors}
                  studentsById={studentsById}
                />
              </td>
              <td className="px-3 py-3 align-top">
                <RelatedStudents ids={student.avoid} studentsById={studentsById} />
              </td>
              <td className="px-3 py-3">
                <Button
                  disabled={!onEdit}
                  onClick={() => onEdit?.(student)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
