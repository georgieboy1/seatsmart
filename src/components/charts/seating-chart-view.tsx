"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import type { SeatingChart } from "@/lib/types/chart";
import { generateSeating } from "@/lib/seating/generate";
import type { GenerationOptions, SeatingIssue, SeatExplanation } from "@/lib/seating/types";
import type { Cohort } from "@/lib/types/cohort";
import { createChart, updateChart } from "@/lib/charts/actions";
import { listAttendees } from "@/lib/attendees/actions";
import { exportToCsv, exportToJson, exportToPng } from "@/lib/charts/export";
import { SeatingChartGrid } from "./seating-chart-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Save, 
  RotateCcw, 
  ChevronLeft, 
  AlertTriangle, 
  Info, 
  Trophy,
  Download,
  Ban,
  Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminology } from "@/components/providers/terminology-provider";

type BooleanGenerationOption = Exclude<
  keyof GenerationOptions,
  "lockedSeats" | "seed"
>;

type Props = {
  layout: ClassroomLayout;
  attendees: Attendee[];
  cohorts: Cohort[];
  initialChart?: SeatingChart | null;
  cohortId?: string;
};

export function SeatingChartView({ 
  layout, 
  attendees: initialAttendees, 
  cohorts,
  initialChart, 
  cohortId 
}: Props) {
  const t = useTerminology();
  const router = useRouter();

  const GENERATION_OPTION_CONTROLS: {
    id: BooleanGenerationOption;
    label: string;
  }[] = useMemo(() => [
    { id: "honorDietaryAccessibility", label: `Honor ${t.constraints.toLowerCase()}` },
    { id: "respectMustSitTogether", label: `Respect ${t.together.toLowerCase()}` },
    { id: "respectStrictlySeparate", label: `Respect ${t.separate.toLowerCase()}` },
    { id: "spreadAntisocialTraits", label: "Spread social groups" },
  ], [t]);

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [name, setName] = useState(initialChart?.name ?? "New Seating Chart");
  const [isStale, setIsStale] = useState(initialChart?.stale ?? false);
  const [sidebarCohortId, setSidebarCohortId] = useState<string | "all" | "unassigned">(
    cohortId || initialChart?.cohortId || "all"
  );
  
  const [options, setOptions] = useState<GenerationOptions>({
    honorDietaryAccessibility: true,
    respectMustSitTogether: true,
    respectStrictlySeparate: true,
    spreadAntisocialTraits: true,
    seed: initialChart?.seed ?? 0,
  });

  const [assignments, setAssignments] = useState<Record<string, string>>(
    initialChart?.assignments ?? {}
  );
  const [lockedSeats, setLockedSeats] = useState<Record<string, string>>(
    initialChart?.lockedSeats ?? {}
  );
  const [score, setScore] = useState<number>(initialChart?.score ?? 0);
  const [issues, setIssues] = useState<SeatingIssue[]>([]);
  const [explanations, setExplanations] = useState<Record<string, SeatExplanation[]>>({});

  const unassignedAttendees = useMemo(() => {
    // Ensure we have a set of all currently assigned IDs
    const assignedIds = new Set(
      Object.values(assignments).filter((id): id is string => typeof id === "string" && id !== "")
    );
    // Filter the full roster to find attendees not in the chart
    const unplaced = attendees.filter((g) => !assignedIds.has(g.id));

    if (sidebarCohortId === "all") return unplaced;
    if (sidebarCohortId === "unassigned") return unplaced.filter(g => !g.cohortId);
    return unplaced.filter(g => g.cohortId === sidebarCohortId);
  }, [attendees, assignments, sidebarCohortId]);

  const handleGenerate = useCallback(() => {
    const result = generateSeating(attendees, layout, {
      ...options,
      lockedSeats,
    });
    setAssignments(result.assignments);
    setScore(result.score);
    setIssues(result.issues);
    setExplanations(result.explanations);
    setIsStale(false);
  }, [attendees, layout, options, lockedSeats]);

  const handleSwap = useCallback((fromKey: string, toKey: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const fromAttendeeId = next[fromKey];
      const toAttendeeId = next[toKey];
      
      if (fromAttendeeId) next[toKey] = fromAttendeeId;
      else delete next[toKey];
      
      if (toAttendeeId) next[fromKey] = toAttendeeId;
      else delete next[fromKey];
      
      return next;
    });
    setScore(0);
    setExplanations({});
    setIssues([]);
  }, []);

  const handleLockToggle = useCallback((seatKey: string) => {
    setLockedSeats((prev) => {
      const next = { ...prev };
      if (next[seatKey]) {
        delete next[seatKey];
      } else if (assignments[seatKey]) {
        next[seatKey] = assignments[seatKey];
      }
      return next;
    });
  }, [assignments]);

  const handleClear = useCallback((seatKey: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[seatKey];
      return next;
    });
    setLockedSeats((prev) => {
      const next = { ...prev };
      delete next[seatKey];
      return next;
    });
  }, []);

  const handleAssign = useCallback((seatKey: string, externalId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      // If attendee was already assigned elsewhere, clear that seat
      for (const [key, val] of Object.entries(next)) {
        if (val === externalId) delete next[key];
      }
      next[seatKey] = externalId;
      return next;
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const chartData = {
        layoutId: layout.id,
        cohortId: cohortId || initialChart?.cohortId || null,
        name,
        assignments,
        lockedSeats,
        score,
        seed: options.seed ?? 0,
        stale: false,
        staleReasons: [],
      };

      if (initialChart) {
        await updateChart(initialChart.id, chartData);
        setIsStale(false);
      } else {
        const id = await createChart(chartData);
        router.push(`/charts/${id}`);
      }
    } catch (error) {
      console.error("Failed to save chart:", error);
      alert("Failed to save chart. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    const totalSeats = layout.grid.flat().filter(c => c === "seat").length;
    const assignedCount = Object.keys(assignments).length;
    return { totalSeats, assignedCount };
  }, [layout, assignments]);

  const handleRefreshRoster = async () => {
    setIsRefreshing(true);
    try {
      const freshAttendees = await listAttendees(cohortId);
      setAttendees(freshAttendees);
    } catch (error) {
      console.error("Failed to refresh attendees:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const attendeesById = useMemo(() => 
    new Map(attendees.map(g => [g.id, g])),
    [attendees]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {isStale && (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            <span>
              This chart is out of date: {initialChart?.staleReasons.join(", ") || "the layout or roster has changed."}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-white" onClick={handleGenerate}>
              Regenerate
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={async () => {
                setIsStale(false);
                if (initialChart) {
                  await updateChart(initialChart.id, { stale: false, staleReasons: [] });
                }
              }}
            >
              Keep as-is
            </Button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0"
              placeholder="Chart name..."
            />
            <p className="text-sm text-muted-foreground">
              Layout: {layout.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshRoster} 
            disabled={isRefreshing}
            title={`Refresh ${t.person.toLowerCase()} list`}
          >
            <RotateCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={Object.keys(assignments).length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToPng(name, "seating-chart-grid")}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCsv(name, assignments, attendeesById)}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToJson(name, { name, layoutId: layout.id, assignments, score })}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleSave} 
            disabled={isSaving || Object.keys(assignments).length === 0}
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Chart"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* Left Panel: Controls & Issues */}
        <div className="w-80 flex flex-col gap-6 overflow-hidden">
          <div className="space-y-4 rounded-lg border p-4 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Unplaced {t.people}</h3>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                {unassignedAttendees.length}
              </span>
            </div>
            <select
              value={sidebarCohortId}
              onChange={(e) => setSidebarCohortId(e.target.value as any)}
              className="w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All {t.people}</option>
              <option value="unassigned">No {t.group}</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ScrollArea className="h-48 rounded-md border bg-muted/20">
              <div className="p-2 space-y-1">
                {unassignedAttendees.length === 0 ? (
                  <p className="text-[10px] text-center text-muted-foreground py-4 italic">
                    No unplaced {t.people.toLowerCase()} found.
                  </p>
                ) : (
                  unassignedAttendees.map((g) => (
                    <div 
                      key={g.id}
                      className="text-xs px-2 py-1.5 rounded border bg-card shadow-sm cursor-default hover:border-primary/50 transition-colors"
                    >
                      {g.name}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4 rounded-lg border p-4 bg-card">
            <h3 className="font-medium text-sm">Generation Options</h3>
            <div className="space-y-3">
              {GENERATION_OPTION_CONTROLS.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={opt.id} 
                    checked={options[opt.id]}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, [opt.id]: !!checked }))
                    }
                  />
                  <Label htmlFor={opt.id} className="text-sm font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
            <Button onClick={handleGenerate} className="w-full" variant="secondary">
              <RotateCcw className="mr-2 h-4 w-4" />
              {assignments && Object.keys(assignments).length > 0 ? "Regenerate" : "Generate"}
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border p-4 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Locked Seats</h3>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                {Object.keys(lockedSeats).length}
              </span>
            </div>
            <Button 
              onClick={() => setLockedSeats({})} 
              className="w-full" 
              variant="outline"
              disabled={Object.keys(lockedSeats).length === 0}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Unlock All
            </Button>
          </div>

          <div className="flex-1 flex flex-col rounded-lg border overflow-hidden bg-card">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <h3 className="font-medium text-sm">Issues & Score</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                <Trophy className="h-3 w-3" />
                <span className="text-xs font-bold">{score}</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Info className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs italic">No issues detected.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issues.map((issue, i) => (
                      <div key={i} className="flex gap-2 text-xs leading-snug">
                        {issue.severity === "error" ? (
                          <Ban className="h-4 w-4 text-destructive shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Center: Grid */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto rounded-xl border bg-muted/5 p-8 relative">
          <div className="absolute top-4 right-4 flex gap-4 text-xs text-muted-foreground">
            <div>Seats: <span className="font-medium text-foreground">{stats.totalSeats}</span></div>
            <div>Placed: <span className="font-medium text-foreground">{stats.assignedCount}</span></div>
            <div>Locked: <span className="font-medium text-foreground">{Object.keys(lockedSeats).length}</span></div>
          </div>
          
          <SeatingChartGrid
            layout={layout}
            attendees={attendees}
            unassignedAttendees={unassignedAttendees}
            assignments={assignments}
            lockedSeats={lockedSeats}
            explanations={explanations}
            onSwap={handleSwap}
            onLockToggle={handleLockToggle}
            onClear={handleClear}
            onAssign={handleAssign}
          />

          {Object.keys(assignments).length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm z-10">
               <p className="mb-4 text-lg font-medium">Ready to generate?</p>
               <Button onClick={handleGenerate} size="lg">
                 Generate Seating Chart
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
