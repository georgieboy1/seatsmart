import { useState, useMemo, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Attendee } from "@/lib/types/attendee";
import type { Cohort } from "@/lib/types/cohort";
import {
  DIETARY_ACCESSIBILITY,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "@/lib/attendees/constants";
import { assignAttendeesToCohort, deleteAttendees } from "@/lib/attendees/actions";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTerminology } from "@/components/providers/terminology-provider";

const prosocialLabels = new Map(
  PROSOCIAL_TRAITS.map((trait) => [trait.value, trait.label]),
);
const antisocialLabels = new Map(
  ANTISOCIAL_TRAITS.map((trait) => [trait.value, trait.label]),
);
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

function RelatedAttendees({
  ids,
  attendeesById,
}: {
  ids: string[];
  attendeesById: Map<string, Attendee>;
}) {
  if (ids.length === 0) {
    return <span className="text-muted-foreground">0</span>;
  }

  const names = ids.map((id) => attendeesById.get(id)?.name ?? "Unknown attendee");

  return (
    <span title={names.join(", ")} aria-label={`${ids.length}: ${names.join(", ")}`}>
      {ids.length}
    </span>
  );
}

type SortConfig = {
  key: keyof Attendee | "cohort";
  direction: "asc" | "desc";
} | null;

export function AttendeesList({
  attendees,
  cohorts,
  onEdit,
}: {
  attendees: Attendee[];
  cohorts: Cohort[];
  onEdit?: (attendee: Attendee) => void;
}) {
  const t = useTerminology();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [, startTransition] = useTransition();

  // Optimistic projection of the attendees list so bulk delete reflects
  // immediately while the server action persists in the background. The
  // server action's revalidatePath refreshes the `attendees` prop, which
  // resyncs the optimistic state automatically.
  const [optimisticAttendees, optimisticallyRemove] = useOptimistic(
    attendees,
    (current, idsToRemove: string[]) =>
      current.filter((a) => !idsToRemove.includes(a.id)),
  );

  const cohortsById = useMemo(() => new Map(cohorts.map((c) => [c.id, c])), [cohorts]);
  const attendeesById = useMemo(
    () => new Map(optimisticAttendees.map((attendee) => [attendee.id, attendee])),
    [optimisticAttendees],
  );

  const sortedAttendees = useMemo(() => {
    if (!sortConfig) return optimisticAttendees;

    return [...optimisticAttendees].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Attendee];
      let bValue: any = b[sortConfig.key as keyof Attendee];

      if (sortConfig.key === "cohort") {
        aValue = cohortsById.get(a.cohortId || "")?.name ?? "";
        bValue = cohortsById.get(b.cohortId || "")?.name ?? "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [optimisticAttendees, sortConfig, cohortsById]);

  const toggleSort = (key: keyof Attendee | "cohort") => {
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
    if (selectedIds.size === optimisticAttendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(optimisticAttendees.map((g) => g.id)));
    }
  };

  const handleBulkCohortUpdate = async (cohortId: string | null) => {
    setIsUpdating(true);
    try {
      await assignAttendeesToCohort(Array.from(selectedIds), cohortId);
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
      toast.promise(deleteAttendees(idsToDelete), {
        loading: `Deleting ${idsToDelete.length} ${wordPerson}…`,
        success: `Deleted ${idsToDelete.length} ${wordPerson}.`,
        error: `Failed to delete — list will refresh.`,
      });
    });
  };

  const handleInlineCohortUpdate = async (attendeeId: string, cohortId: string | null) => {
    setEditingCohortId(null);
    try {
      await assignAttendeesToCohort([attendeeId], cohortId);
    } catch (error) {
      console.error(error);
      alert(`Failed to update ${t.person.toLowerCase()}`);
    }
  };

  if (optimisticAttendees.length === 0) {
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
              onChange={(e) => handleBulkCohortUpdate(e.target.value === "none" ? null : e.target.value)}
              className="border-[1.5px] border-foreground bg-background px-2 py-1"
              value=""
            >
              <option value="" disabled>Select {t.group.toLowerCase()}...</option>
              <option value="none">No {t.group}</option>
              {cohorts.map((c) => (
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
                  checked={selectedIds.size === optimisticAttendees.length && optimisticAttendees.length > 0}
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
              <th className="px-3 py-3 font-medium text-center">Together</th>
              <th className="px-3 py-3 font-medium text-center">Separate</th>
              <th className="px-3 py-3 font-medium">{t.constraints}</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAttendees.map((attendee) => (
              <tr key={attendee.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-3">
                  <Checkbox 
                    checked={selectedIds.has(attendee.id)}
                    onCheckedChange={() => toggleSelect(attendee.id)}
                  />
                </td>
                <td className="px-3 py-3 font-medium">
                  {attendee.name}
                  {attendee.familyName && (
                    <span className="font-normal"> {attendee.familyName}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {editingCohortId === attendee.id ? (
                    <select
                      autoFocus
                      className="rounded-md border bg-background px-1 py-0.5 text-xs"
                      defaultValue={attendee.cohortId || ""}
                      onChange={(e) => handleInlineCohortUpdate(attendee.id, e.target.value === "" ? null : e.target.value)}
                      onBlur={() => setEditingCohortId(null)}
                    >
                      <option value="">None</option>
                      {cohorts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div 
                      className="cursor-pointer hover:underline underline-offset-4 decoration-dotted"
                      onClick={() => setEditingCohortId(attendee.id)}
                    >
                      {cohortsById.get(attendee.cohortId || "")?.name ?? (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 align-top text-center">
                  <RelatedAttendees
                    ids={attendee.togetherIds}
                    attendeesById={attendeesById}
                  />
                </td>
                <td className="px-3 py-3 align-top text-center">
                  <RelatedAttendees ids={attendee.separateIds} attendeesById={attendeesById} />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <ChipList
                      values={attendee.constraints}
                      labels={dietaryAccessibilityLabels}
                    />
                    {attendee.healthFlags.map((flag) => (
                      <span key={flag} className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full w-fit">
                        {flag}
                      </span>
                    ))}
                    {attendee.allergies.map((allergy) => (
                      <span key={allergy} className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded-full w-fit">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Button
                    disabled={!onEdit}
                    onClick={() => onEdit?.(attendee)}
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
