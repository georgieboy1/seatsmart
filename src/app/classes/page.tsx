"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateClass, deleteClass } from "@/lib/classes/actions";
import { useClasses, useStudents } from "@/lib/local/hooks";
import { FlashMessages } from "@/components/local/flash-messages";
import { ChevronLeft, Trash2, Save, Users } from "lucide-react";
import { getTerminology } from "@/lib/utils/terminology";

export default function ClassesPage() {
  const t = getTerminology();

  const classes = useClasses();
  const students = useStudents();

  const studentsByClass = students.reduce((acc, student) => {
    const classId = student.classId || "unassigned";
    if (!acc[classId]) acc[classId] = [];
    acc[classId].push(student);
    return acc;
  }, {} as Record<string, typeof students>);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Manage {t.groups}</h1>
          <p className="text-sm text-muted-foreground">
            Rename or delete your {t.people.toLowerCase()} groups.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <FlashMessages />
      </Suspense>

      <div className="grid gap-6">
        {classes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No {t.groups.toLowerCase()} found. Create one on the dashboard.
            </CardContent>
          </Card>
        ) : (
          classes.map((cohort) => (
            <Card key={cohort.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <form 
                  action={updateClass.bind(null, cohort.id)} 
                  className="flex flex-1 gap-2"
                >
                  <Input 
                    name="name" 
                    defaultValue={cohort.name} 
                    required 
                    className="flex-1 font-semibold text-lg"
                  />
                  <Button type="submit" size="icon" variant="outline" title="Save name">
                    <Save className="h-4 w-4" />
                  </Button>
                </form>
                <form action={deleteClass.bind(null, cohort.id)}>
                  <Button
                    type="submit"
                    size="icon"
                    variant="destructive"
                    title={`Delete ${t.group.toLowerCase()}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <Users className="h-4 w-4" />
                    {t.people} ({studentsByClass[cohort.id]?.length || 0})
                  </div>
                  {studentsByClass[cohort.id] && studentsByClass[cohort.id].length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {studentsByClass[cohort.id].map((student) => (
                        <div 
                          key={student.id} 
                          className="text-sm border rounded-md px-3 py-2 bg-muted/30 flex items-center justify-between"
                        >
                          {student.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      No {t.people.toLowerCase()} assigned to this {t.group.toLowerCase()}.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {studentsByClass["unassigned"] && studentsByClass["unassigned"].length > 0 && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg opacity-50">Unassigned {t.people}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {studentsByClass["unassigned"].map((student) => (
                  <div 
                    key={student.id} 
                    className="text-sm border rounded-md px-3 py-2 bg-muted/10 flex items-center justify-between"
                  >
                    {student.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
