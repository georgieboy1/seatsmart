export type WorkspaceType = "education" | "events";

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
  group: "Cohort",
  groups: "Cohorts",
  constraints: "Accommodations",
  together: "Peer Tutors",
  separate: "Avoid List",
  roster: "Roster",
  externalId: "Student ID",
};

const EVENTS_TERMINOLOGY: Terminology = {
  person: "Guest",
  people: "Guests",
  group: "Social Group",
  groups: "Social Groups",
  constraints: "Dietary & Accessibility",
  together: "Must sit together",
  separate: "Strictly separate",
  roster: "Guest List",
  externalId: "External ID / Ticket #",
};

export function getTerminology(workspaceType: WorkspaceType = "education"): Terminology {
  return workspaceType === "events" ? EVENTS_TERMINOLOGY : EDUCATION_TERMINOLOGY;
}
