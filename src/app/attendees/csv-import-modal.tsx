"use client";

import { importAttendeesCsv } from "@/lib/attendees/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTerminology } from "@/components/providers/terminology-provider";

export function CsvImportModal({ onClose }: { onClose: () => void }) {
  const t = useTerminology();
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="mt-10 w-full max-w-xl rounded-lg border bg-background shadow-lg"
        role="dialog"
      >
        <form action={importAttendeesCsv}>
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Import {t.people.toLowerCase()} from CSV
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Required columns: name, prosocial, antisocial, constraints.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="attendee-csv">CSV file</Label>
              <Input
                accept=".csv,text/csv"
                id="attendee-csv"
                name="csv"
                required
                type="file"
              />
            </div>

            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Example</p>
              <pre className="mt-2 overflow-x-auto">
                name,prosocial,antisocial,constraints{"\n"}
                Maya Chen,&quot;helpful; focused&quot;,talkative,&quot;vegan;
                wheelchair-access&quot;
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t p-5">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Import CSV</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
