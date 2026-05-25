"use client";

import { useState } from "react";
import type { Student } from "@/lib/types/student";
import {
  ACCOMMODATIONS,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "@/lib/students/constants";
import { createStudent, updateStudent } from "@/lib/students/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentFormModalProps = {
  student: Student | null;
  students: Student[];
  onClose: () => void;
};

type CheckboxGroupProps = {
  name: "prosocialTraits" | "antisocialTraits" | "accommodations";
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

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function RelationshipPicker({
  currentStudentId,
  students,
  peerTutors,
  avoid,
  onPeerTutorsChange,
  onAvoidChange,
}: {
  currentStudentId: string | null;
  students: Student[];
  peerTutors: string[];
  avoid: string[];
  onPeerTutorsChange: (ids: string[]) => void;
  onAvoidChange: (ids: string[]) => void;
}) {
  const options = students.filter((student) => student.id !== currentStudentId);

  if (options.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Add at least one other student before choosing peer tutors or avoid-list
        relationships.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Peer tutors</legend>
        <div className="space-y-2">
          {options.map((option) => {
            const checked = peerTutors.includes(option.id);
            const disabled = avoid.includes(option.id);

            return (
              <label
                key={option.id}
                className="flex gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  aria-label={`${option.name} as peer tutor`}
                  checked={checked}
                  className="mt-1 size-4"
                  disabled={disabled}
                  name="peerTutors"
                  onChange={() => onPeerTutorsChange(toggleId(peerTutors, option.id))}
                  type="checkbox"
                  value={option.id}
                />
                <span>
                  <span className="block font-medium">{option.name}</span>
                  {disabled && (
                    <span className="block text-xs text-muted-foreground">
                      Remove from avoid list first.
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Avoid list</legend>
        <div className="space-y-2">
          {options.map((option) => {
            const checked = avoid.includes(option.id);
            const disabled = peerTutors.includes(option.id);

            return (
              <label
                key={option.id}
                className="flex gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  aria-label={`${option.name} on avoid list`}
                  checked={checked}
                  className="mt-1 size-4"
                  disabled={disabled}
                  name="avoid"
                  onChange={() => onAvoidChange(toggleId(avoid, option.id))}
                  type="checkbox"
                  value={option.id}
                />
                <span>
                  <span className="block font-medium">{option.name}</span>
                  {disabled && (
                    <span className="block text-xs text-muted-foreground">
                      Remove from peer tutors first.
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export function StudentFormModal({
  student,
  students,
  onClose,
}: StudentFormModalProps) {
  const isEditing = Boolean(student);
  const action = student ? updateStudent.bind(null, student.id) : createStudent;
  const initialPeerTutors = student?.peerTutors ?? [];
  const initialAvoid = (student?.avoid ?? []).filter(
    (id) => !initialPeerTutors.includes(id),
  );
  const [peerTutors, setPeerTutors] = useState(initialPeerTutors);
  const [avoid, setAvoid] = useState(initialAvoid);

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
              {isEditing ? "Edit student" : "Add student"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Traits and accommodations are fixed for v1.0 so the seating
              algorithm can reason about them predictably.
            </p>
          </div>

          <div className="space-y-6 p-5">
            <div className="space-y-2">
              <Label htmlFor="student-name">Name</Label>
              <Input
                autoFocus
                defaultValue={student?.name ?? ""}
                id="student-name"
                maxLength={100}
                name="name"
                required
              />
            </div>

            <CheckboxGroup
              name="prosocialTraits"
              title="Prosocial traits"
              options={PROSOCIAL_TRAITS}
              selected={student?.prosocialTraits ?? []}
            />

            <CheckboxGroup
              name="antisocialTraits"
              title="Antisocial traits"
              options={ANTISOCIAL_TRAITS}
              selected={student?.antisocialTraits ?? []}
            />

            <CheckboxGroup
              name="accommodations"
              title="Accommodations"
              options={ACCOMMODATIONS}
              selected={student?.accommodations ?? []}
            />

            <RelationshipPicker
              currentStudentId={student?.id ?? null}
              students={students}
              peerTutors={peerTutors}
              avoid={avoid}
              onPeerTutorsChange={setPeerTutors}
              onAvoidChange={setAvoid}
            />

            <div className="space-y-2">
              <Label htmlFor="student-notes">Notes</Label>
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
            <Button type="submit">{isEditing ? "Save changes" : "Add student"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
