"use client";

import Link from "next/link";
import { useState } from "react";
import type { Student } from "@/lib/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CsvImportModal } from "./csv-import-modal";
import { StudentFormModal } from "./student-form-modal";
import { StudentsList } from "./students-list";

export function StudentsRoster({ students }: { students: Student[] }) {
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
            aria-label="Search students"
            disabled
            placeholder="Search students (coming with table actions)"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setIsAdding(true)} type="button">
            Add student
          </Button>
          <Button
            onClick={() => setIsImporting(true)}
            type="button"
            variant="outline"
          >
            Import CSV
          </Button>
          <Button asChild variant="outline">
            <Link href="/students/export">Export CSV</Link>
          </Button>
        </div>
      </div>

      <StudentsList students={students} onEdit={setModalStudent} />

      {(isAdding || modalStudent) && (
        <StudentFormModal
          student={modalStudent}
          students={students}
          onClose={closeModal}
        />
      )}

      {isImporting && <CsvImportModal onClose={closeModal} />}
    </>
  );
}
