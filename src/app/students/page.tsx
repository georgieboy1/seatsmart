"use client";

import { Suspense } from "react";
import { useClasses, useStudents } from "@/lib/local/hooks";
import { StudentRoster } from "./student-roster";
import { getTerminology } from "@/lib/utils/terminology";
import { FlashMessages } from "@/components/local/flash-messages";

export default function StudentsPage() {
  const students = useStudents();
  const classes = useClasses();
  const t = getTerminology();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t.people}</h1>
        <p className="text-sm text-muted-foreground">
          {students.length === 0
            ? `Build your ${t.person.toLowerCase()} list before generating a chart.`
            : `${students.length} ${students.length === 1 ? t.person.toLowerCase() : t.people.toLowerCase()}`}
        </p>
      </div>

      <Suspense fallback={null}>
        <FlashMessages />
      </Suspense>

      <StudentRoster students={students} classes={classes} />
    </main>
  );
}
