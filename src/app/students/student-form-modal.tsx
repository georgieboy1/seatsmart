"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/lib/types/student";
import type { Class } from "@/lib/types/class";
import { DIETARY_ACCESSIBILITY } from "@/lib/students/constants";
import { createStudent, updateStudent } from "@/lib/students/actions";
import { listClasses } from "@/lib/classes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RelationshipMultiSelect } from "@/components/ui/relationship-multi-select";
import { useTerminology } from "@/components/providers/terminology-provider";

type StudentFormModalProps = {
  student: Student | null;
  students: Student[];
  onClose: () => void;
};

type CheckboxGroupProps = {
  name: "prosocialTraits" | "antisocialTraits" | "constraints";
  title: string;
  options: readonly { value: string; label: string; description?: string }[];
  selected: readonly string[];
};

function CheckboxGroup({ name, title, options, selected }: CheckboxGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex gap-2 rounded-md border p-2 text-sm"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.includes(option.value)}
              className="mt-1 size-4"
            />
            <span>
              <span className="block font-medium">{option.label}</span>
              {option.description && (
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RelationshipPicker({
  currentStudentId,
  students,
  togetherIds,
  separateIds,
  togetherLabel,
  separateLabel,
  onMustSitTogetherChange,
  onStrictlySeparateChange,
}: {
  currentStudentId: string | null;
  students: Student[];
  togetherIds: string[];
  separateIds: string[];
  togetherLabel: string;
  separateLabel: string;
  onMustSitTogetherChange: (ids: string[]) => void;
  onStrictlySeparateChange: (ids: string[]) => void;
}) {
  const options = students
    .filter((student) => student.id !== currentStudentId)
    .map((s) => ({ id: s.id, name: s.name }));

  if (options.length === 0) {
    return (
      <div className="border-[1.5px] border-dashed border-foreground/30 p-4 text-sm text-muted-foreground">
        Add at least one other person before choosing relationship rules.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{togetherLabel}</legend>
        <RelationshipMultiSelect
          name="togetherIds"
          options={options}
          selectedIds={togetherIds}
          excludedIds={separateIds}
          excludedHint={`In ${separateLabel.toLowerCase()} list`}
          placeholder={`+ Add ${togetherLabel.toLowerCase()}…`}
          onChange={onMustSitTogetherChange}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{separateLabel}</legend>
        <RelationshipMultiSelect
          name="separateIds"
          options={options}
          selectedIds={separateIds}
          excludedIds={togetherIds}
          excludedHint={`In ${togetherLabel.toLowerCase()} list`}
          placeholder={`+ Add ${separateLabel.toLowerCase()}…`}
          onChange={onStrictlySeparateChange}
        />
      </fieldset>
    </div>
  );
}

export function StudentFormModal({
  student,
  students,
  onClose,
}: StudentFormModalProps) {
  const t = useTerminology();
  const isEditing = Boolean(student);
  const action = student ? updateStudent.bind(null, student.id) : createStudent;
  const initialTogether = student?.togetherIds ?? [];
  const initialSeparate = (student?.separateIds ?? []).filter(
    (id) => !initialTogether.includes(id),
  );
  const [togetherIds, setTogetherIds] = useState(initialTogether);
  const [separateIds, setSeparateIds] = useState(initialSeparate);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    listClasses().then(setClasses);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="mt-10 w-full max-w-3xl rounded-lg border bg-background shadow-lg"
        role="dialog"
      >
        <form key={student?.id ?? "new"} action={action}>
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              {isEditing ? `Edit ${t.person.toLowerCase()}` : `Add ${t.person.toLowerCase()}`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Social proximity and {t.constraints.toLowerCase()} help the algorithm arrange the perfect layout.
            </p>
          </div>

          <div className="space-y-6 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student-name">First Name</Label>
                <Input
                  autoFocus
                  defaultValue={student?.name ?? ""}
                  id="student-name"
                  maxLength={100}
                  name="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-familyName">Last Name</Label>
                <Input
                  defaultValue={student?.familyName ?? ""}
                  id="student-familyName"
                  maxLength={100}
                  name="familyName"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-class">{t.group}</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={student?.classId ?? ""}
                  id="student-class"
                  name="classId"
                >
                  <option value="">No {t.group}</option>
                  {classes.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-age">Age (optional)</Label>
                <Input
                  defaultValue={student?.age ?? ""}
                  id="student-age"
                  name="age"
                  type="number"
                  min={1}
                />
              </div>
            </div>

            <CheckboxGroup
              name="constraints"
              title={t.constraints}
              options={DIETARY_ACCESSIBILITY}
              selected={student?.constraints ?? []}
            />

            <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="student-allergies">Specific Allergies</Label>
                <Input
                  defaultValue={student?.allergies?.join(", ") ?? ""}
                  id="student-allergies"
                  name="allergies"
                  placeholder="Peanuts, Shellfish, etc."
                />
              </div>

              <p className="text-[11px] font-medium text-amber-800 leading-tight">
                Note: Health and dietary data is sensitive. Ensure compliance with privacy policies before storing medical data.
              </p>
            </div>

            <RelationshipPicker
              currentStudentId={student?.id ?? null}
              students={students}
              togetherIds={togetherIds}
              separateIds={separateIds}
              togetherLabel={t.together}
              separateLabel={t.separate}
              onMustSitTogetherChange={setTogetherIds}
              onStrictlySeparateChange={setSeparateIds}
            />

            <div className="space-y-2">
              <Label htmlFor="student-notes">Internal Planner Notes</Label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={student?.notes ?? ""}
                id="student-notes"
                maxLength={1000}
                name="notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t p-5">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Save changes" : `Add ${t.person.toLowerCase()}`}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
