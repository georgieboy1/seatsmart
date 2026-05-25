"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { Attendee } from "@/lib/types/attendee";
import type { Cohort } from "@/lib/types/cohort";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CsvImportModal } from "./csv-import-modal";
import { AttendeeFormModal } from "./attendee-form-modal";
import { AttendeesList } from "./attendees-list";
import { useTerminology } from "@/components/providers/terminology-provider";

export function AttendeesRoster({ 
  attendees, 
  cohorts 
}: { 
  attendees: Attendee[];
  cohorts: Cohort[];
}) {
  const t = useTerminology();
  const [modalAttendee, setModalAttendee] = useState<Attendee | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const lowerQuery = searchQuery.toLowerCase();
    return attendees.filter((g) => g.name.toLowerCase().includes(lowerQuery));
  }, [attendees, searchQuery]);

  const closeModal = () => {
    setIsAdding(false);
    setIsImporting(false);
    setModalAttendee(null);
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
          <Button asChild variant="outline">
            <Link href="/attendees/export">Export CSV</Link>
          </Button>
        </div>
      </div>

      <AttendeesList 
        attendees={filteredAttendees} 
        cohorts={cohorts}
        onEdit={setModalAttendee} 
      />

      {(isAdding || modalAttendee) && (
        <AttendeeFormModal
          attendee={modalAttendee}
          attendees={attendees}
          onClose={closeModal}
        />
      )}

      {isImporting && <CsvImportModal onClose={closeModal} />}
    </>
  );
}
