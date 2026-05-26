import type { Student } from "@/lib/types/student";
import {
  DIETARY_ACCESSIBILITY,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
} from "./constants";

export const prosocialLookup = new Map(
  PROSOCIAL_TRAITS.flatMap((t) => [
    [t.value.toLowerCase(), t.value],
    [t.label.toLowerCase(), t.value],
  ]),
);

export const antisocialLookup = new Map(
  ANTISOCIAL_TRAITS.flatMap((t) => [
    [t.value.toLowerCase(), t.value],
    [t.label.toLowerCase(), t.value],
  ]),
);

export const dietaryAccessibilityLookup = new Map(
  DIETARY_ACCESSIBILITY.flatMap((a) => [
    [a.value.toLowerCase(), a.value],
    [a.label.toLowerCase(), a.value],
  ]),
);

/**
 * Parses raw CSV or TSV (pasted from Excel) into a 2D string array.
 * Handles quoted cells and escaped quotes.
 */
export function parseRawTextToGrid(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter: tab if any line has tabs, otherwise comma
  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ",";

  return lines.map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

export function normalizeList<T extends string>(
  value: string,
  lookup: Map<string, T>,
): { normalized: T[]; unknown: string[] } {
  const rawValues = value
    .split(/[;|,]/)
    .map((v) => v.trim())
    .filter(Boolean);
  const normalizedValues: T[] = [];
  const unknownValues: string[] = [];

  for (const val of rawValues) {
    const match = lookup.get(val.toLowerCase());
    if (match) {
      normalizedValues.push(match);
    } else {
      unknownValues.push(val);
    }
  }

  return {
    normalized: [...new Set(normalizedValues)],
    unknown: [...new Set(unknownValues)],
  };
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

export function serializeStudentsCsv(students: Student[]): string {
  const rows = [
    ["name", "prosocial", "antisocial", "constraints"],
    ...students.map((student) => [
      student.name,
      serializeList(student.prosocialTraits),
      serializeList(student.antisocialTraits),
      serializeList(student.constraints),
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}
