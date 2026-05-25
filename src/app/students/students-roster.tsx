"use client";

import { useState } from "react";
import type { Student } from "@/lib/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentFormModal } from "./student-form-modal";
import { StudentsList } from "./students-list";

export function StudentsRoster({ students }: { students: Student[] }) {
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const closeModal = () => {
    setIsAdding(false);
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
          <Button disabled variant="outline" title="CSV import lands in Commit 3.6">
            Import CSV
          </Button>
          <Button disabled variant="outline" title="CSV export lands in Commit 3.7">
            Export CSV
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
    </>
  );
}
