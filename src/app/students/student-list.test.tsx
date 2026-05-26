import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Student } from "@/lib/types/student";
import { StudentList } from "./student-list";
import { TerminologyProvider } from "@/components/providers/terminology-provider";

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: ["helpful"],
    antisocialTraits: ["talkative"],
    constraints: ["front_of_room"],
    togetherIds: [],
    separateIds: [],
    healthFlags: [],
    allergies: [],
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("StudentList", () => {
  it("shows an empty state when there are no students", () => {
    render(
      <TerminologyProvider>
        <StudentList students={[]} classes={[]} />
      </TerminologyProvider>,
    );
    expect(screen.getByText(/no students yet/i)).toBeInTheDocument();
  });

  it("renders roster rows with accommodation chips", () => {
    render(
      <TerminologyProvider>
        <StudentList
          classes={[]}
          students={[
            makeStudent({
              name: "Maya Chen",
              constraints: ["front_of_room", "near_teacher"],
            }),
          ]}
        />
      </TerminologyProvider>,
    );

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("Front of Room")).toBeInTheDocument();
    expect(screen.getByText("Near Teacher")).toBeInTheDocument();
  });

  it("shows dashes for empty accommodation arrays", () => {
    render(
      <TerminologyProvider>
        <StudentList
          classes={[]}
          students={[
            makeStudent({
              constraints: [],
            }),
          ]}
        />
      </TerminologyProvider>,
    );

    expect(screen.getAllByText("—")).toHaveLength(1);
  });

  it("shows peer tutor and separateIds counts with names in the title", () => {
    const maya = makeStudent({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Maya Chen",
      togetherIds: ["22222222-2222-4222-8222-222222222222"],
      separateIds: ["33333333-3333-4333-8333-333333333333"],
    });
    const sam = makeStudent({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Sam Patel",
    });
    const jordan = makeStudent({
      id: "33333333-3333-4333-8333-333333333333",
      name: "Jordan Lee",
    });

    render(
      <TerminologyProvider>
        <StudentList classes={[]} students={[maya, sam, jordan]} />
      </TerminologyProvider>,
    );

    expect(screen.getByLabelText("1: Sam Patel")).toHaveAttribute(
      "title",
      "Sam Patel",
    );
    expect(screen.getByLabelText("1: Jordan Lee")).toHaveAttribute(
      "title",
      "Jordan Lee",
    );
  });
});
