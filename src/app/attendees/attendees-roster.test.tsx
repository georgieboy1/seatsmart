import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Attendee } from "@/lib/types/attendee";
import { AttendeesRoster } from "./attendees-roster";

vi.mock("@/lib/cohorts/actions", () => ({
  listCohorts: vi.fn(async () => []),
}));

function makeAttendee(overrides: Partial<Attendee> = {}): Attendee {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: ["helpful"],
    antisocialTraits: ["talkative"],
    constraints: ["front_of_room"],
    togetherIds: [],
    separateIds: [],
    notes: "Prefers predictable routines.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("AttendeesRoster", () => {
  it("opens the add attendee modal", () => {
    render(<AttendeesRoster attendees={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add attendee/i }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /add attendee/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/name/i)).toHaveValue("");
    expect(
      within(dialog).getByRole("button", { name: /add attendee/i }),
    ).toBeInTheDocument();
  });

  it("opens the edit modal with existing values checked", () => {
    render(<AttendeesRoster attendees={[makeAttendee()]} />);

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /edit attendee/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/name/i)).toHaveValue("Maya Chen");
    expect(within(dialog).getByLabelText(/helpful/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/talkative/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/front of room/i)).toBeChecked();
    expect(within(dialog).getByLabelText(/notes/i)).toHaveValue(
      "Prefers predictable routines.",
    );
  });

  it("checks existing peer tutor and separateIds relationships on edit", () => {
    render(
      <AttendeesRoster
        attendees={[
          makeAttendee({
            id: "11111111-1111-4111-8111-111111111111",
            name: "Maya Chen",
            togetherIds: ["22222222-2222-4222-8222-222222222222"],
            separateIds: ["33333333-3333-4333-8333-333333333333"],
          }),
          makeAttendee({
            id: "22222222-2222-4222-8222-222222222222",
            name: "Sam Patel",
          }),
          makeAttendee({
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
      within(dialog).getByLabelText(/jordan lee on separateIds list/i),
    ).toBeChecked();
  });

  it("does not show the current attendee as a relationship option", () => {
    render(
      <AttendeesRoster
        attendees={[
          makeAttendee({
            id: "11111111-1111-4111-8111-111111111111",
            name: "Maya Chen",
          }),
          makeAttendee({
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

  it("keeps peer tutor and separateIds choices mutually exclusive", () => {
    render(
      <AttendeesRoster
        attendees={[
          makeAttendee({
            id: "11111111-1111-4111-8111-111111111111",
            name: "Maya Chen",
          }),
          makeAttendee({
            id: "22222222-2222-4222-8222-222222222222",
            name: "Sam Patel",
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);

    const dialog = screen.getByRole("dialog");
    const peerTutor = within(dialog).getByLabelText(/sam patel as peer tutor/i);
    const separateIds = within(dialog).getByLabelText(/sam patel on separateIds list/i);

    fireEvent.click(peerTutor);

    expect(peerTutor).toBeChecked();
    expect(separateIds).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    render(<AttendeesRoster attendees={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add attendee/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the CSV import modal", () => {
    render(<AttendeesRoster attendees={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /import attendees from csv/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/csv file/i)).toHaveAttribute(
      "type",
      "file",
    );
  });

  it("links to CSV export", () => {
    render(<AttendeesRoster attendees={[]} />);

    expect(screen.getByRole("link", { name: /export csv/i })).toHaveAttribute(
      "href",
      "/attendees/export",
    );
  });
});
