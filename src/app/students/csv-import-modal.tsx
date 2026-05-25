"use client";

import { importStudentsCsv } from "@/lib/students/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CsvImportModal({ onClose }: { onClose: () => void }) {
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
        <form action={importStudentsCsv}>
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Import students from CSV
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Required columns: name, prosocial, antisocial, accommodations.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="student-csv">CSV file</Label>
              <Input
                accept=".csv,text/csv"
                id="student-csv"
                name="csv"
                required
                type="file"
              />
            </div>

            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Example</p>
              <pre className="mt-2 overflow-x-auto">
                name,prosocial,antisocial,accommodations{"\n"}
                Maya Chen,&quot;helpful; focused&quot;,talkative,&quot;front_of_room;
                near_teacher&quot;
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
