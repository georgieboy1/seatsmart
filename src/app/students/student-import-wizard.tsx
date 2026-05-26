"use client";

import { useState, useMemo } from "react";
import { importStudentsCsv } from "@/lib/students/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTerminology } from "@/components/providers/terminology-provider";
import {
  parseRawTextToGrid,
  normalizeList,
  prosocialLookup,
  antisocialLookup,
  dietaryAccessibilityLookup,
} from "@/lib/students/csv";
import type { StudentCreateInput } from "@/lib/students/schemas";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "input" | "map" | "preview";

type MappingField = 
  | "name" 
  | "externalId" 
  | "age" 
  | "familyName" 
  | "notes" 
  | "constraints" 
  | "allergies" 
  | "healthFlags" 
  | "prosocialTraits" 
  | "antisocialTraits" 
  | "ignore";

export function StudentImportWizard({ onClose }: { onClose: () => void }) {
  const t = useTerminology();
  const [step, setStep] = useState<Step>("input");
  const [rawText, setRawText] = useState("");
  const [grid, setGrid] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<number, MappingField>>({});

  const fieldOptions: { value: MappingField; label: string }[] = [
    { value: "ignore", label: "Ignore Column" },
    { value: "name", label: "Full Name (Required)" },
    { value: "externalId", label: t.externalId },
    { value: "age", label: "Age" },
    { value: "familyName", label: "Family / Group Name" },
    { value: "notes", label: "Notes" },
    { value: "constraints", label: t.constraints },
    { value: "allergies", label: "Allergies" },
    { value: "healthFlags", label: "Health Flags" },
    { value: "prosocialTraits", label: "Prosocial Traits" },
    { value: "antisocialTraits", label: "Antisocial Traits" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      setRawText(text);
      processRawText(text);
    }
  };

  const processRawText = (text: string) => {
    const parsedGrid = parseRawTextToGrid(text);
    if (parsedGrid.length > 0) {
      setGrid(parsedGrid);
      
      // Auto-guess mappings
      const headers = parsedGrid[0];
      const initialMappings: Record<number, MappingField> = {};
      headers.forEach((header, index) => {
        const h = header.toLowerCase().trim();
        if (h.includes("name") && !h.includes("family")) initialMappings[index] = "name";
        else if (h.includes("family") || h.includes("group")) initialMappings[index] = "familyName";
        else if (h.includes("id") || h.includes("ticket") || h.includes("external")) initialMappings[index] = "externalId";
        else if (h.includes("age")) initialMappings[index] = "age";
        else if (h.includes("note")) initialMappings[index] = "notes";
        else if (h.includes("constraint") || h.includes("dietary") || h.includes("accommodation")) initialMappings[index] = "constraints";
        else if (h.includes("allergy") || h.includes("allergies")) initialMappings[index] = "allergies";
        else if (h.includes("health") || h.includes("flag")) initialMappings[index] = "healthFlags";
        else if (h.includes("prosocial")) initialMappings[index] = "prosocialTraits";
        else if (h.includes("antisocial")) initialMappings[index] = "antisocialTraits";
        else initialMappings[index] = "ignore";
      });
      setMappings(initialMappings);
      setStep("map");
    }
  };

  const mappedData = useMemo(() => {
    if (grid.length < 2) return [];
    
    // Assume first row is header if we're at the map step, 
    // otherwise use all rows if user says no headers (TODO).
    // For now, always skip first row for data.
    const dataRows = grid.slice(1);
    
    return dataRows.map((row): StudentCreateInput & { errors: string[] } => {
      const student: StudentCreateInput = {
        name: "",
        togetherIds: [],
        separateIds: [],
        allergies: [],
        healthFlags: [],
        prosocialTraits: [],
        antisocialTraits: [],
        constraints: [],
        notes: null,
      };
      const errors: string[] = [];

      Object.entries(mappings).forEach(([colIndex, field]) => {
        const value = row[parseInt(colIndex)]?.trim() || "";
        if (field === "ignore") return;

        if (field === "name") {
          student.name = value;
        } else if (field === "age") {
          const age = parseInt(value);
          student.age = isNaN(age) ? null : age;
        } else if (field === "constraints") {
          const { normalized, unknown } = normalizeList(value, dietaryAccessibilityLookup);
          student.constraints = normalized;
          if (unknown.length > 0) errors.push(`Unknown ${t.constraints.toLowerCase()}: ${unknown.join(", ")}`);
        } else if (field === "prosocialTraits") {
          const { normalized, unknown } = normalizeList(value, prosocialLookup);
          student.prosocialTraits = normalized;
          if (unknown.length > 0) errors.push(`Unknown prosocial traits: ${unknown.join(", ")}`);
        } else if (field === "antisocialTraits") {
          const { normalized, unknown } = normalizeList(value, antisocialLookup);
          student.antisocialTraits = normalized;
          if (unknown.length > 0) errors.push(`Unknown antisocial traits: ${unknown.join(", ")}`);
        } else if (field === "allergies") {
          student.allergies = value.split(/[;|,]/).map(v => v.trim()).filter(Boolean);
        } else if (field === "healthFlags") {
          student.healthFlags = value.split(/[;|,]/).map(v => v.trim()).filter(Boolean);
        } else if (field === "notes" || field === "externalId" || field === "familyName") {
          student[field] = value || null;
        }
      });

      if (!student.name) errors.push("Name is required");

      return { ...student, errors };
    });
  }, [grid, mappings, t]);

  const hasNameMapping = Object.values(mappings).includes("name");
  const isValid = hasNameMapping && mappedData.every(d => d.errors.length === 0);
  const totalWithErrors = mappedData.filter(d => d.errors.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="presentation">
      <div aria-modal="true" className="mt-10 w-full max-w-4xl rounded-lg border bg-background shadow-lg overflow-hidden flex flex-col max-h-[85vh]" role="dialog">
        
        {/* Header */}
        <div className="border-b p-5 flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Import {t.people}</h2>
            <p className="text-sm text-muted-foreground">
              {step === "input" && "Paste data from Excel or upload a CSV file."}
              {step === "map" && "Map your columns to the correct fields."}
              {step === "preview" && `Review ${mappedData.length} records before importing.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("size-2 rounded-full", step === "input" ? "bg-primary" : "bg-muted")} />
            <div className={cn("size-2 rounded-full", step === "map" ? "bg-primary" : "bg-muted")} />
            <div className={cn("size-2 rounded-full", step === "preview" ? "bg-primary" : "bg-muted")} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Input */}
          {step === "input" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="paste-data">Paste from Excel or Google Sheets</Label>
                <Textarea
                  id="paste-data"
                  placeholder="Name&#9;Age&#9;Notes..."
                  className="min-h-[200px] font-mono text-xs"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or upload a file</span></div>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 border-muted-foreground/20 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground/60">CSV or TSV files</p>
                  </div>
                  <input type="file" className="hidden" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Map */}
          {step === "map" && (
            <div className="space-y-4">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex gap-3 text-sm text-amber-800">
                <AlertCircle className="size-5 shrink-0" />
                <p>Ensure the <strong>Name</strong> column is mapped correctly. All other fields are optional.</p>
              </div>
              
              <div className="overflow-x-auto pb-4 border rounded-md">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {grid[0].map((_, i) => (
                        <th key={i} className="p-3 min-w-[200px]">
                          <select
                            className={cn(
                              "w-full h-9 rounded-md border bg-background px-2 py-1 text-sm outline-none",
                              mappings[i] === "name" ? "border-primary ring-1 ring-primary/20" : "border-input"
                            )}
                            value={mappings[i] || "ignore"}
                            onChange={(e) => setMappings({ ...mappings, [i]: e.target.value as MappingField })}
                          >
                            {fieldOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.slice(0, 4).map((row, rowIndex) => (
                      <tr key={rowIndex} className={cn("border-b last:border-0", rowIndex === 0 && "bg-muted/20 italic text-muted-foreground")}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className="p-3 border-r last:border-0 truncate max-w-[200px]">
                            {cell}
                            {rowIndex === 0 && <span className="ml-2 text-[10px] uppercase font-bold text-muted-foreground/50">(Header?)</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              {totalWithErrors > 0 && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex gap-3 text-sm text-destructive">
                  <AlertCircle className="size-5 shrink-0" />
                  <p><strong>{totalWithErrors} row(s) have errors.</strong> Please correct your mappings or data before importing. Rows with errors will be blocked.</p>
                </div>
              )}

              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-muted/50 border-b sticky top-0">
                    <tr>
                      <th className="p-3 w-10">Status</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">{t.constraints}</th>
                      <th className="p-3">Traits</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedData.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="p-3">
                          {row.errors.length > 0 ? (
                            <div className="group relative cursor-help">
                              <AlertCircle className="size-4 text-destructive" />
                              <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block w-64 p-2 bg-destructive text-destructive-foreground text-xs rounded shadow-lg">
                                {row.errors.join(". ")}
                              </div>
                            </div>
                          ) : (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          )}
                        </td>
                        <td className="p-3 font-medium">{row.name || <span className="text-destructive">Missing</span>}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {row.constraints.map(c => (
                              <span key={c} className="text-[10px] border px-1 rounded">{c}</span>
                            ))}
                            {row.constraints.length === 0 && <span className="text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                            {row.prosocialTraits.length + row.antisocialTraits.length} traits
                          </div>
                        </td>
                        <td className="p-3 truncate max-w-xs">{row.notes || <span className="text-muted-foreground">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-5 flex justify-between bg-muted/30">
          <Button onClick={step === "input" ? onClose : () => setStep(step === "map" ? "input" : "map")} variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            {step === "input" ? "Cancel" : "Back"}
          </Button>
          
          <div className="flex gap-2">
            {step === "input" && (
              <Button onClick={() => processRawText(rawText)} disabled={!rawText.trim()} className="gap-2">
                Continue to Mapping
                <ArrowRight className="size-4" />
              </Button>
            )}
            
            {step === "map" && (
              <Button onClick={() => setStep("preview")} disabled={!hasNameMapping} className="gap-2">
                Review Data
                <ArrowRight className="size-4" />
              </Button>
            )}

            {step === "preview" && (
              <form action={importStudentsCsv}>
                <input type="hidden" name="json" value={JSON.stringify(mappedData.filter(d => d.errors.length === 0))} />
                <Button type="submit" disabled={!isValid || mappedData.length === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="size-4" />
                  Import {mappedData.length} {t.people}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
