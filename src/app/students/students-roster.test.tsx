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

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

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

  it("preserves existing peer tutor and avoid ids as hidden inputs on edit", () => {
    render(
      <StudentsRoster
        students={[
          makeStudent({
            peerTutors: ["22222222-2222-4222-8222-222222222222"],
            avoid: ["33333333-3333-4333-8333-333333333333"],
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    const peerTutorInput = dialog.querySelector<HTMLInputElement>(
      'input[name="peerTutors"]',
    );
    const avoidInput =
      dialog.querySelector<HTMLInputElement>('input[name="avoid"]');

    expect(peerTutorInput).toHaveValue("22222222-2222-4222-8222-222222222222");
    expect(avoidInput).toHaveValue("33333333-3333-4333-8333-333333333333");
  });

  it("closes the modal when Cancel is clicked", () => {
    render(<StudentsRoster students={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add student/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
