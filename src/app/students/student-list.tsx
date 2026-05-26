import { useState, useMemo, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types/student";
import type { Class } from "@/lib/types/class";
import {
  DIETARY_ACCESSIBILITY,
} from "@/lib/students/constants";
import { assignStudentsToClass, deleteStudents } from "@/lib/students/actions";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTerminology } from "@/components/providers/terminology-provider";

const dietaryAccessibilityLabels = new Map(
  DIETARY_ACCESSIBILITY.map((item) => [item.value, item.label]),
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

type SortConfig = {
  key: keyof Student | "cohort";
  direction: "asc" | "desc";
} | null;

export function StudentList({
  students,
  classes,
  onEdit,
}: {
  students: Student[];
  classes: Class[];
  onEdit?: (student: Student) => void;
}) {
  const t = useTerminology();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [, startTransition] = useTransition();

  // Optimistic projection of the students list so bulk delete reflects
  // immediately while the server action persists in the background. The
  // server action's revalidatePath refreshes the `students` prop, which
  // resyncs the optimistic state automatically.
  const [optimisticStudents, optimisticallyRemove] = useOptimistic(
    students,
    (current, idsToRemove: string[]) =>
      current.filter((a) => !idsToRemove.includes(a.id)),
  );

  const classesById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const studentsById = useMemo(
    () => new Map(optimisticStudents.map((student) => [student.id, student])),
    [optimisticStudents],
  );

  const sortedStudents = useMemo(() => {
    if (!sortConfig) return optimisticStudents;

    return [...optimisticStudents].sort((a, b) => {
      let aValue = (a[sortConfig.key as keyof Student]?.toString() ?? "");
      let bValue = (b[sortConfig.key as keyof Student]?.toString() ?? "");

      if (sortConfig.key === "cohort") {
        aValue = classesById.get(a.classId || "")?.name ?? "";
        bValue = classesById.get(b.classId || "")?.name ?? "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [optimisticStudents, sortConfig, classesById]);

  const toggleSort = (key: keyof Student | "cohort") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === optimisticStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(optimisticStudents.map((g) => g.id)));
    }
  };

  const handleBulkClassUpdate = async (classId: string | null) => {
    setIsUpdating(true);
    try {
      await assignStudentsToClass(Array.from(selectedIds), classId);
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
      alert(`Failed to update ${t.people.toLowerCase()}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    const wordPerson =
      idsToDelete.length === 1 ? t.person.toLowerCase() : t.people.toLowerCase();
    const confirmed = window.confirm(
      `Delete ${idsToDelete.length} ${wordPerson}? This cannot be undone.`,
    );
    if (!confirmed) return;

    // Optimistic: rows disappear from the table immediately. The bulk
    // toolbar collapses because selectedIds clears. The server action
    // runs in the background; on success the page revalidates and the
    // optimistic projection resyncs. On error, sonner surfaces the
    // failure and React rolls back the optimistic state on next render.
    startTransition(async () => {
      optimisticallyRemove(idsToDelete);
      setSelectedIds(new Set());
      toast.promise(deleteStudents(idsToDelete), {
        loading: `Deleting ${idsToDelete.length} ${wordPerson}…`,
        success: `Deleted ${idsToDelete.length} ${wordPerson}.`,
        error: `Failed to delete — list will refresh.`,
      });
    });
  };

  const handleInlineClassUpdate = async (studentId: string, classId: string | null) => {
    setEditingClassId(null);
    try {
      await assignStudentsToClass([studentId], classId);
    } catch (error) {
      console.error(error);
      alert(`Failed to update ${t.person.toLowerCase()}`);
    }
  };

  if (optimisticStudents.length === 0) {
    return (
      <div className="border-[1.5px] border-dashed border-foreground/30 p-12 text-center">
        <p className="text-base font-medium">No {t.people.toLowerCase()} yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first {t.person.toLowerCase()} in the next step, then build the rest of your
          {t.roster.toLowerCase()} from the table.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-[1.5px] border-foreground bg-muted/50 p-2 text-sm">
          <span className="font-medium tabular-nums">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Move to {t.group}:</span>
            <select
              disabled={isUpdating}
              onChange={(e) => handleBulkClassUpdate(e.target.value === "none" ? null : e.target.value)}
              className="border-[1.5px] border-foreground bg-background px-2 py-1"
              value=""
            >
              <option value="" disabled>Select {t.group.toLowerCase()}...</option>
              <option value="none">No {t.group}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={isUpdating}
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            Clear selection
          </Button>
        </div>
      )}

      <div className="overflow-x-auto border-[1.5px] border-foreground">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b-[1.5px] border-foreground bg-background text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 w-10">
                <Checkbox
                  checked={selectedIds.size === optimisticStudents.length && optimisticStudents.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th
                className="px-3 py-3 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Full Name
                  {sortConfig?.key === "name" && (
                    sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                className="px-3 py-3 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("cohort")}
              >
                <div className="flex items-center gap-1">
                  {t.group}
                  {sortConfig?.key === "cohort" && (
                    sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-3 py-3 font-medium text-center">{t.together}</th>
              <th className="px-3 py-3 font-medium text-center">{t.separate}</th>
              <th className="px-3 py-3 font-medium">{t.constraints}</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student) => (
              <tr key={student.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-3">
                  <Checkbox 
                    checked={selectedIds.has(student.id)}
                    onCheckedChange={() => toggleSelect(student.id)}
                  />
                </td>
                <td className="px-3 py-3 font-medium">
                  {student.name}
                  {student.familyName && (
                    <span className="font-normal"> {student.familyName}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {editingClassId === student.id ? (
                    <select
                      autoFocus
                      className="rounded-md border bg-background px-1 py-0.5 text-xs"
                      defaultValue={student.classId || ""}
                      onChange={(e) => handleInlineClassUpdate(student.id, e.target.value === "" ? null : e.target.value)}
                      onBlur={() => setEditingClassId(null)}
                    >
                      <option value="">None</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div 
                      className="cursor-pointer hover:underline underline-offset-4 decoration-dotted"
                      onClick={() => setEditingClassId(student.id)}
                    >
                      {classesById.get(student.classId || "")?.name ?? (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 align-top text-center">
                  <RelatedStudents
                    ids={student.togetherIds}
                    studentsById={studentsById}
                  />
                </td>
                <td className="px-3 py-3 align-top text-center">
                  <RelatedStudents ids={student.separateIds} studentsById={studentsById} />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <ChipList
                      values={student.constraints}
                      labels={dietaryAccessibilityLabels}
                    />
                    {student.healthFlags.map((flag) => (
                      <span key={flag} className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full w-fit">
                        {flag}
                      </span>
                    ))}
                    {student.allergies.map((allergy) => (
                      <span key={allergy} className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded-full w-fit">
                        {allergy}
                      </span>
                    ))}
                  </div>
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
    </div>
  );
}
