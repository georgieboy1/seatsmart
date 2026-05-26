import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Student } from "@/lib/types/student";
import { StudentRoster } from "./student-roster";
import { TerminologyProvider } from "@/components/providers/terminology-provider";

vi.mock("@/lib/classes/actions", () => ({
  listClasses: vi.fn(async () => []),
}));

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
    notes: "Prefers predictable routines.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("StudentRoster", () => {
  it("opens the add student modal", () => {
    render(
      <TerminologyProvider>
        <StudentRoster students={[]} classes={[]} />
      </TerminologyProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add student/i }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /add student/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/first name/i)).toHaveValue("");
    expect(
      within(dialog).getByRole("button", { name: /add student/i }),
    ).toBeInTheDocument();
  });

  it("opens the edit modal with existing values checked", () => {
    render(
      <TerminologyProvider>
        <StudentRoster students={[makeStudent()]} classes={[]} />
      </TerminologyProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: /edit student/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/first name/i)).toHaveValue("Maya Chen");
    expect(within(dialog).getByLabelText(/front of room/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/internal planner notes/i)).toHaveValue(
      "Prefers predictable routines.",
    );
  });

  it("checks existing peer tutor and avoid list relationships on edit", () => {
    render(
      <TerminologyProvider>
        <StudentRoster
          classes={[]}
          students={[
            makeStudent({
              id: "11111111-1111-4111-8111-111111111111",
              name: "Maya Chen",
              togetherIds: ["22222222-2222-4222-8222-222222222222"],
              separateIds: ["33333333-3333-4333-8333-333333333333"],
            }),
            makeStudent({
              id: "22222222-2222-4222-8222-222222222222",
              name: "Sam Patel",
            }),
            makeStudent({
              id: "33333333-3333-4333-8333-333333333333",
              name: "Jordan Lee",
            }),
          ]}
        />
      </TerminologyProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    // New tag-based UI shows selected names in the summary box
    expect(within(dialog).getByText("Sam Patel")).toBeInTheDocument();
    expect(within(dialog).getByText("Jordan Lee")).toBeInTheDocument();
  });

  it("does not show the current student as a relationship option", async () => {
    render(
      <TerminologyProvider>
        <StudentRoster
          classes={[]}
          students={[
            makeStudent({
              id: "11111111-1111-4111-8111-111111111111",
              name: "Maya Chen",
            }),
            makeStudent({
              id: "22222222-2222-4222-8222-222222222222",
              name: "Sam Patel",
            }),
          ]}
        />
      </TerminologyProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    // Open the popover first
    fireEvent.click(within(dialog).getByRole("button", { name: /\+ add peer supports…/i }));
    
    expect(within(dialog).queryByText("Maya Chen")).not.toBeInTheDocument();
    expect(await screen.findAllByText("Sam Patel")).toHaveLength(2);
  });

  it("closes the modal when Cancel is clicked", () => {
    render(
      <TerminologyProvider>
        <StudentRoster students={[]} classes={[]} />
      </TerminologyProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add student/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the CSV import modal", () => {
    render(
      <TerminologyProvider>
        <StudentRoster students={[]} classes={[]} />
      </TerminologyProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /import students/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/paste from excel/i)).toBeInTheDocument();
  });

  it("shows Export CSV button", () => {
    render(
      <TerminologyProvider>
        <StudentRoster students={[]} classes={[]} />
      </TerminologyProvider>,
    );

    expect(screen.getByRole("button", { name: /export csv/i })).toBeInTheDocument();
  });
});
