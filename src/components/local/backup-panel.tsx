"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBackup, parseBackup, replaceAll, storageIsWorking } from "@/lib/local/store";
import { useHydrated } from "@/lib/local/hooks";
import { Download, Upload, HardDrive } from "lucide-react";

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BackupPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);

  const handleDownload = () => {
    if (
      !window.confirm(
        "This backup contains your students' names, accommodations and seating notes. Store it somewhere private.",
      )
    ) {
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    download(`syndesk-backup-${date}.json`, JSON.stringify(createBackup(), null, 2), "application/json");
    toast.success("Backup downloaded");
  };

  const handleRestore = async (file: File) => {
    setBusy(true);
    try {
      const data = parseBackup(await file.text());
      const counts = `${data.students.length} students, ${data.cohorts.length} classes, ${data.layouts.length} layouts, ${data.seating_charts.length} charts`;
      if (
        !window.confirm(
          `Restore this backup (${counts})? It replaces everything currently saved in this browser.`,
        )
      ) {
        return;
      }
      replaceAll(data);
      toast.success("Backup restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read that backup.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Your data</CardTitle>
        <HardDrive className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Saved only in this browser on this device. Download a backup to keep a copy or to move
          to another computer.
        </p>
        {hydrated && !storageIsWorking() && (
          <p role="alert" className="border-[1.5px] border-destructive p-2 text-xs text-destructive">
            This browser isn&apos;t letting SynDesk save (private window or storage blocked). Your
            work will be lost when you close the tab. Download a backup before leaving.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download backup
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Restore backup
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Choose a SynDesk backup file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleRestore(file);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
