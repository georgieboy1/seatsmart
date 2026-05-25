import type { LayoutType } from "@/lib/types/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  type: LayoutType;
  rows: number;
  columns: number;
  numGroups: number;
  studentsPerGroup: number;
  onRowsChange: (n: number) => void;
  onColumnsChange: (n: number) => void;
  onNumGroupsChange: (n: number) => void;
  onStudentsPerGroupChange: (n: number) => void;
  onApply: () => void;
};

export function ControlsPanel(props: Props) {
  return (
    <aside className="space-y-4 rounded-md border p-4">
      <h2 className="text-sm font-semibold">Layout dimensions</h2>

      {props.type === "traditional" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="rows">Rows (1–10)</Label>
            <Input
              id="rows"
              type="number"
              min={1}
              max={10}
              value={props.rows}
              onChange={(e) => props.onRowsChange(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="columns">Columns (1–10)</Label>
            <Input
              id="columns"
              type="number"
              min={1}
              max={10}
              value={props.columns}
              onChange={(e) => props.onColumnsChange(Number(e.target.value))}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="numGroups">Groups (1–12)</Label>
            <Input
              id="numGroups"
              type="number"
              min={1}
              max={12}
              value={props.numGroups}
              onChange={(e) => props.onNumGroupsChange(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentsPerGroup">Students per group (1–8)</Label>
            <Input
              id="studentsPerGroup"
              type="number"
              min={1}
              max={8}
              value={props.studentsPerGroup}
              onChange={(e) =>
                props.onStudentsPerGroupChange(Number(e.target.value))
              }
            />
          </div>
        </>
      )}

      <Button
        type="button"
        onClick={props.onApply}
        variant="outline"
        className="w-full"
      >
        Apply
      </Button>
      <p className="text-xs text-muted-foreground">
        Applying regenerates the grid and discards unsaved cell edits.
      </p>
    </aside>
  );
}
