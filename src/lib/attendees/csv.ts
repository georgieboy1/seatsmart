import type { AttendeeCreateInput } from "./schemas";
import type { Attendee } from "@/lib/types/attendee";
import {
  DIETARY_ACCESSIBILITY,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "./constants";

const prosocialLookup = new Map(
  PROSOCIAL_TRAITS.flatMap((t) => [
    [t.value.toLowerCase(), t.value],
    [t.label.toLowerCase(), t.value],
  ]),
);

const antisocialLookup = new Map(
  ANTISOCIAL_TRAITS.flatMap((t) => [
    [t.value.toLowerCase(), t.value],
    [t.label.toLowerCase(), t.value],
  ]),
);

const dietaryAccessibilityLookup = new Map(
  DIETARY_ACCESSIBILITY.flatMap((a) => [
    [a.value.toLowerCase(), a.value],
    [a.label.toLowerCase(), a.value],
  ]),
);

function parseCsvObjects(csv: string): Record<string, string>[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });
    return obj;
  });
}

function normalizeList<T extends string>(
  row: number,
  column: string,
  value: string,
  lookup: Map<string, T>,
): T[] {
  const rawValues = value
    .split(/[;|,]/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const normalizedValues: T[] = [];

  for (const val of rawValues) {
    const match = lookup.get(val);
    if (match) {
      normalizedValues.push(match);
    }
  }

  return [...new Set(normalizedValues)];
}

export function parseAttendeesCsv(csv: string): AttendeeCreateInput[] {
  return parseCsvObjects(csv).map((row, index) => {
    const rowNumber = index + 2;
    const name = row.name?.trim() ?? "";

    if (!name) {
      throw new Error(`Row ${rowNumber}: name is required`);
    }

    return {
      name,
      prosocialTraits: normalizeList(
        rowNumber,
        "prosocial",
        row.prosocial ?? "",
        prosocialLookup,
      ),
      antisocialTraits: normalizeList(
        rowNumber,
        "antisocial",
        row.antisocial ?? "",
        antisocialLookup,
      ),
      constraints: normalizeList(
        rowNumber,
        "constraints",
        row.constraints ?? row.constraints ?? "",
        dietaryAccessibilityLookup,
      ),
      togetherIds: [],
      separateIds: [],
      allergies: [],
      healthFlags: [],
      notes: null,
    };
  });
}

function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function serializeList(values: readonly string[]): string {
  return values.join("; ");
}

export function serializeAttendeesCsv(attendees: Attendee[]): string {
  const rows = [
    ["name", "prosocial", "antisocial", "constraints"],
    ...attendees.map((attendee) => [
      attendee.name,
      serializeList(attendee.prosocialTraits),
      serializeList(attendee.antisocialTraits),
      serializeList(attendee.constraints),
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}
