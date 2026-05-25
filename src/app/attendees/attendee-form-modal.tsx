"use client";

import { useEffect, useState } from "react";
import type { Attendee } from "@/lib/types/attendee";
import type { Cohort } from "@/lib/types/cohort";
import {
  DIETARY_ACCESSIBILITY,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "@/lib/attendees/constants";
import { createAttendee, updateAttendee } from "@/lib/attendees/actions";
import { listCohorts } from "@/lib/cohorts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTerminology } from "@/components/providers/terminology-provider";

type AttendeeFormModalProps = {
  attendee: Attendee | null;
  attendees: Attendee[];
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

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function RelationshipPicker({
  currentAttendeeId,
  attendees,
  togetherIds,
  separateIds,
  togetherLabel,
  separateLabel,
  onMustSitTogetherChange,
  onStrictlySeparateChange,
}: {
  currentAttendeeId: string | null;
  attendees: Attendee[];
  togetherIds: string[];
  separateIds: string[];
  togetherLabel: string;
  separateLabel: string;
  onMustSitTogetherChange: (ids: string[]) => void;
  onStrictlySeparateChange: (ids: string[]) => void;
}) {
  const options = attendees.filter((attendee) => attendee.id !== currentAttendeeId);

  if (options.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Add at least one other person before choosing relationship rules.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{togetherLabel}</legend>
        <div className="space-y-2">
          {options.map((option) => {
            const checked = togetherIds.includes(option.id);
            const disabled = separateIds.includes(option.id);

            return (
              <label
                key={option.id}
                className="flex gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  aria-label={`${option.name} ${togetherLabel.toLowerCase()}`}
                  checked={checked}
                  className="mt-1 size-4"
                  disabled={disabled}
                  name="togetherIds"
                  onChange={() => onMustSitTogetherChange(toggleId(togetherIds, option.id))}
                  type="checkbox"
                  value={option.id}
                />
                <span>
                  <span className="block font-medium">{option.name}</span>
                  {disabled && (
                    <span className="block text-xs text-muted-foreground">
                      Remove from separate list first.
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{separateLabel}</legend>
        <div className="space-y-2">
          {options.map((option) => {
            const checked = separateIds.includes(option.id);
            const disabled = togetherIds.includes(option.id);

            return (
              <label
                key={option.id}
                className="flex gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  aria-label={`${option.name} ${separateLabel.toLowerCase()}`}
                  checked={checked}
                  className="mt-1 size-4"
                  disabled={disabled}
                  name="separateIds"
                  onChange={() => onStrictlySeparateChange(toggleId(separateIds, option.id))}
                  type="checkbox"
                  value={option.id}
                />
                <span>
                  <span className="block font-medium">{option.name}</span>
                  {disabled && (
                    <span className="block text-xs text-muted-foreground">
                      Remove from together list first.
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

export function AttendeeFormModal({
  attendee,
  attendees,
  onClose,
}: AttendeeFormModalProps) {
  const t = useTerminology();
  const isEditing = Boolean(attendee);
  const action = attendee ? updateAttendee.bind(null, attendee.id) : createAttendee;
  const initialTogether = attendee?.togetherIds ?? [];
  const initialSeparate = (attendee?.separateIds ?? []).filter(
    (id) => !initialTogether.includes(id),
  );
  const [togetherIds, setTogetherIds] = useState(initialTogether);
  const [separateIds, setSeparateIds] = useState(initialSeparate);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    listCohorts().then(setCohorts);
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
        <form key={attendee?.id ?? "new"} action={action}>
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
                <Label htmlFor="attendee-name">First Name</Label>
                <Input
                  autoFocus
                  defaultValue={attendee?.name ?? ""}
                  id="attendee-name"
                  maxLength={100}
                  name="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee-familyName">Last Name</Label>
                <Input
                  defaultValue={attendee?.familyName ?? ""}
                  id="attendee-familyName"
                  maxLength={100}
                  name="familyName"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee-cohort">{t.group}</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={attendee?.cohortId ?? ""}
                  id="attendee-cohort"
                  name="cohortId"
                >
                  <option value="">No {t.group}</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee-age">Age (optional)</Label>
                <Input
                  defaultValue={attendee?.age ?? ""}
                  id="attendee-age"
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
              selected={attendee?.constraints ?? []}
            />

            <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="attendee-allergies">Specific Allergies</Label>
                <Input
                  defaultValue={attendee?.allergies?.join(", ") ?? ""}
                  id="attendee-allergies"
                  name="allergies"
                  placeholder="Peanuts, Shellfish, etc."
                />
              </div>

              <p className="text-[11px] font-medium text-amber-800 leading-tight">
                Note: Health and dietary data is sensitive. Ensure compliance with privacy policies before storing medical data.
              </p>
            </div>

            <RelationshipPicker
              currentAttendeeId={attendee?.id ?? null}
              attendees={attendees}
              togetherIds={togetherIds}
              separateIds={separateIds}
              togetherLabel={t.together}
              separateLabel={t.separate}
              onMustSitTogetherChange={setTogetherIds}
              onStrictlySeparateChange={setSeparateIds}
            />

            <div className="space-y-2">
              <Label htmlFor="attendee-notes">Internal Planner Notes</Label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={attendee?.notes ?? ""}
                id="attendee-notes"
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
