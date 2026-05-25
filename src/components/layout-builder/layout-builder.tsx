"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type {
  CellType,
  ClassroomLayout,
  LayoutType,
} from "@/lib/types/layout";
import { PERIMETER_CYCLE, INTERIOR_TOGGLE } from "@/lib/types/layout";
import {
  createTraditionalGrid,
  createGroupsGrid,
} from "@/lib/layouts/grid";
import { updateLayout } from "@/lib/layouts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ControlsPanel } from "./controls-panel";
import { GridView } from "./grid-view";
import { Legend } from "./legend";

export function LayoutBuilder({ layout }: { layout: ClassroomLayout }) {
  const [name, setName] = useState(layout.name);
  const [type, setType] = useState<LayoutType>(layout.type);
  const [rows, setRows] = useState(layout.rows ?? 5);
  const [columns, setColumns] = useState(layout.columns ?? 6);
  const [numGroups, setNumGroups] = useState(layout.numGroups ?? 4);
  const [studentsPerGroup, setStudentsPerGroup] = useState(
    layout.studentsPerGroup ?? 4,
  );
  const [grid, setGrid] = useState<CellType[][]>(layout.grid);

  // Baseline for "discard edits?" check. Updated after every successful
  // Apply so future Applies compare against the most recent baseline,
  // not the original load.
  const originalGridRef = useRef(layout.grid);

  function handleCellClick(r: number, c: number) {
    setGrid((prev) => {
      const totalRows = prev.length;
      const totalCols = prev[0]?.length ?? 0;
      const isPerimeter =
        r === 0 || r === totalRows - 1 || c === 0 || c === totalCols - 1;

      const cycle = isPerimeter ? PERIMETER_CYCLE : INTERIOR_TOGGLE;
      const currentIdx = cycle.indexOf(prev[r][c]);
      const nextValue =
        cycle[currentIdx === -1 ? 0 : (currentIdx + 1) % cycle.length];

      const next = prev.map((row) => [...row]);
      next[r][c] = nextValue;
      return next;
    });
  }

  function handleApply() {
    const hasEdits =
      JSON.stringify(grid) !== JSON.stringify(originalGridRef.current);
    if (
      hasEdits &&
      !window.confirm(
        "Applying will regenerate the grid and discard your cell edits. Continue?",
      )
    ) {
      return;
    }

    const next =
      type === "traditional"
        ? createTraditionalGrid(rows, columns)
        : createGroupsGrid(numGroups, studentsPerGroup);

    setGrid(next);
    originalGridRef.current = next;
  }

  return (
    <form
      action={updateLayout.bind(null, layout.id)}
      className="space-y-6"
    >
      {/* Hidden inputs ship React state as FormData on submit. The
          visible inputs above are UX-only — they have no name attr. */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="rows" value={String(rows)} />
      <input type="hidden" name="columns" value={String(columns)} />
      <input type="hidden" name="numGroups" value={String(numGroups)} />
      <input
        type="hidden"
        name="studentsPerGroup"
        value={String(studentsPerGroup)}
      />
      <input type="hidden" name="grid" value={JSON.stringify(grid)} />

      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <Input
          aria-label="Layout name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs text-base font-semibold"
        />
        <div className="flex gap-1 rounded-md border p-1">
          <button
            type="button"
            onClick={() => setType("traditional")}
            className={`rounded px-3 py-1 text-sm ${
              type === "traditional"
                ? "bg-foreground text-background"
                : "text-muted-foreground"
            }`}
            aria-pressed={type === "traditional"}
          >
            Traditional
          </button>
          <button
            type="button"
            onClick={() => setType("groups")}
            className={`rounded px-3 py-1 text-sm ${
              type === "groups"
                ? "bg-foreground text-background"
                : "text-muted-foreground"
            }`}
            aria-pressed={type === "groups"}
          >
            Groups
          </button>
        </div>
        <Button type="submit" className="ml-auto">
          Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr_220px]">
        <ControlsPanel
          type={type}
          rows={rows}
          columns={columns}
          numGroups={numGroups}
          studentsPerGroup={studentsPerGroup}
          onRowsChange={setRows}
          onColumnsChange={setColumns}
          onNumGroupsChange={setNumGroups}
          onStudentsPerGroupChange={setStudentsPerGroup}
          onApply={handleApply}
        />
        <div className="flex justify-center overflow-auto">
          <GridView grid={grid} onCellClick={handleCellClick} />
        </div>
        <Legend />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline">
          Duplicate
        </Button>
        <Button type="button" variant="destructive">
          Delete
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/layouts">Cancel</Link>
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
