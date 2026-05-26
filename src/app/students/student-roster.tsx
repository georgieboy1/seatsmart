"use client";

import { useState, useMemo } from "react";
import type { Student } from "@/lib/types/student";
import type { Class } from "@/lib/types/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentImportWizard } from "./student-import-wizard";
import { StudentFormModal } from "./student-form-modal";
import { StudentList } from "./student-list";
import { useTerminology } from "@/components/providers/terminology-provider";

export function StudentRoster({ 
  students, 
  classes 
}: { 
  students: Student[];
  classes: Class[];
}) {
  const t = useTerminology();
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter((g) => g.name.toLowerCase().includes(lowerQuery));
  }, [students, searchQuery]);

  const closeModal = () => {
    setIsAdding(false);
    setIsImporting(false);
    setModalStudent(null);
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm flex-1">
          <Input
            aria-label={`Search ${t.people.toLowerCase()}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${t.people.toLowerCase()} by name...`}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setIsAdding(true)} type="button">
            Add {t.person.toLowerCase()}
          </Button>
          <Button
            onClick={() => setIsImporting(true)}
            type="button"
            variant="outline"
          >
            Import CSV
          </Button>
          <Button
            onClick={() => {
              if (window.confirm("This export may contain sensitive student accommodation or health information. Store and share it carefully.")) {
                window.location.href = "/students/export";
              }
            }}
            type="button"
            variant="outline"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <StudentList 
        students={filteredStudents} 
        classes={classes}
        onEdit={setModalStudent} 
      />

      {(isAdding || modalStudent) && (
        <StudentFormModal
          student={modalStudent}
          students={students}
          onClose={closeModal}
        />
      )}

      {isImporting && <StudentImportWizard onClose={closeModal} />}
    </>
  );
}
