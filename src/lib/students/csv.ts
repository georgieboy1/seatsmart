import {
  ACCOMMODATIONS,
  ANTISOCIAL_TRAITS,
  PROSOCIAL_TRAITS,
  type Accommodation,
  type AntisocialTrait,
  type ProsocialTrait,
} from "./constants";
import type { StudentCreateInput } from "./schemas";

type CsvRow = {
  [header: string]: string;
};

const prosocialLookup = createOptionLookup<ProsocialTrait>(PROSOCIAL_TRAITS);
const antisocialLookup =
  createOptionLookup<AntisocialTrait>(ANTISOCIAL_TRAITS);
const accommodationLookup =
  createOptionLookup<Accommodation>(ACCOMMODATIONS);

function createOptionLookup<T extends string>(
  options: readonly { value: T; label: string }[],
): Map<string, T> {
  const lookup = new Map<string, T>();
  for (const option of options) {
    lookup.set(normalizeToken(option.value), option.value);
    lookup.set(normalizeToken(option.label), option.value);
  }
  return lookup;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replaceAll(/\s+/g, "_");
}

function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replaceAll(/[\s-]+/g, "_");
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      currentCell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (inQuotes) {
    throw new Error("CSV has an unclosed quoted cell");
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function parseCsvObjects(csv: string): CsvRow[] {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) {
    throw new Error("CSV is empty");
  }

  const headers = rows[0].map(normalizeHeader);
  const requiredHeaders = ["name", "prosocial", "antisocial", "accommodations"];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`CSV is missing required column: ${header}`);
    }
  }

  return rows.slice(1).map((row) => {
    const object: CsvRow = {};
    headers.forEach((header, index) => {
      object[header] = row[index] ?? "";
    });
    return object;
  });
}

function splitMultiValueCell(value: string): string[] {
  return value
    .split(/[;,|]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeList<T extends string>(
  rowNumber: number,
  column: string,
  value: string,
  lookup: Map<string, T>,
): T[] {
  const normalizedValues = splitMultiValueCell(value).map((token) => {
    const normalized = lookup.get(normalizeToken(token));
    if (!normalized) {
      throw new Error(`Row ${rowNumber}: unknown ${column} value "${token}"`);
    }
    return normalized;
  });

  return [...new Set(normalizedValues)];
}

export function parseStudentsCsv(csv: string): StudentCreateInput[] {
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
      accommodations: normalizeList(
        rowNumber,
        "accommodations",
        row.accommodations ?? "",
        accommodationLookup,
      ),
      peerTutors: [],
      avoid: [],
      notes: null,
    };
  });
}
