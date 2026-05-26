export type Terminology = {
  person: string;
  people: string;
  group: string;
  groups: string;
  constraints: string;
  together: string;
  separate: string;
  roster: string;
  externalId: string;
};

const EDUCATION_TERMINOLOGY: Terminology = {
  person: "Student",
  people: "Students",
  group: "Class",
  groups: "Classes",
  constraints: "Accommodations",
  together: "Peer supports",
  separate: "Avoid pairing",
  roster: "Roster",
  externalId: "Student ID",
};

export function getTerminology(): Terminology {
  return EDUCATION_TERMINOLOGY;
}
