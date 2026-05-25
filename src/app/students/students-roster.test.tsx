import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Student } from "@/lib/types/student";
import { StudentsRoster } from "./students-roster";

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: ["helpful"],
    antisocialTraits: ["talkative"],
    accommodations: ["front_of_room"],
    peerTutors: [],
    avoid: [],
    notes: "Prefers predictable routines.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("StudentsRoster", () => {
  it("opens the add student modal", () => {
    render(<StudentsRoster students={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add student/i }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /add student/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/name/i)).toHaveValue("");
    expect(
      within(dialog).getByRole("button", { name: /add student/i }),
    ).toBeInTheDocument();
  });

  it("opens the edit modal with existing values checked", () => {
    render(<StudentsRoster students={[makeStudent()]} />);

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /edit student/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/name/i)).toHaveValue("Maya Chen");
    expect(within(dialog).getByLabelText(/helpful/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/talkative/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/front of room/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/notes/i)).toHaveValue(
      "Prefers predictable routines.",
    );
  });

  it("checks existing peer tutor and avoid relationships on edit", () => {
    render(
      <StudentsRoster
        students={[
          makeStudent({
            id: "11111111-1111-4111-8111-111111111111",
            name: "Maya Chen",
            peerTutors: ["22222222-2222-4222-8222-222222222222"],
            avoid: ["33333333-3333-4333-8333-333333333333"],
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
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByLabelText(/sam patel as peer tutor/i),
    ).toBeChecked();
    expect(
      within(dialog).getByLabelText(/jordan lee on avoid list/i),
    ).toBeChecked();
  });

  it("does not show the current student as a relationship option", () => {
    render(
      <StudentsRoster
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
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).queryByLabelText(/maya chen as peer tutor/i),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByLabelText(/sam patel as peer tutor/i),
    ).toBeInTheDocument();
  });

  it("keeps peer tutor and avoid choices mutually exclusive", () => {
    render(
      <StudentsRoster
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
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    const peerTutor = within(dialog).getByLabelText(/sam patel as peer tutor/i);
    const avoid = within(dialog).getByLabelText(/sam patel on avoid list/i);

    fireEvent.click(peerTutor);

    expect(peerTutor).toBeChecked();
    expect(avoid).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    render(<StudentsRoster students={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add student/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the CSV import modal", () => {
    render(<StudentsRoster students={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /import students from csv/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/csv file/i)).toHaveAttribute(
      "type",
      "file",
    );
  });
});
