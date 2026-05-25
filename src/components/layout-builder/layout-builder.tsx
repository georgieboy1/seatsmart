"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClassroomLayout, LayoutType } from "@/lib/types/layout";
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

  // Grid stays read-only in 2.4. Interactivity (click to edit, Apply
  // to regenerate) lands in 2.5; until then, just display the saved grid.
  const grid = layout.grid;

  return (
    <div className="space-y-6">
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
        <Button className="ml-auto">Save</Button>
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
          onApply={() => {
            /* wired in 2.5 */
          }}
        />
        <div className="flex justify-center overflow-auto">
          <GridView grid={grid} />
        </div>
        <Legend />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button variant="outline">Duplicate</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="ghost" asChild>
          <Link href="/layouts">Cancel</Link>
        </Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}
