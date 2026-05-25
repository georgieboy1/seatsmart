import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Attendee } from "@/lib/types/attendee";
import { AttendeesList } from "./attendees-list";

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
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("AttendeesList", () => {
  it("shows an empty state when there are no attendees", () => {
    render(<AttendeesList attendees={[]} />);
    expect(screen.getByText(/no attendees yet/i)).toBeInTheDocument();
  });

  it("renders roster rows with trait and accommodation chips", () => {
    render(
      <AttendeesList
        attendees={[
          makeAttendee({
            name: "Maya Chen",
            prosocialTraits: ["helpful", "focused"],
            antisocialTraits: ["talkative"],
            constraints: ["front_of_room", "near_teacher"],
          }),
        ]}
      />,
    );

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("Helpful")).toBeInTheDocument();
    expect(screen.getByText("Focused")).toBeInTheDocument();
    expect(screen.getByText("Talkative")).toBeInTheDocument();
    expect(screen.getByText("Front of room")).toBeInTheDocument();
    expect(screen.getByText("Near teacher")).toBeInTheDocument();
  });

  it("shows dashes for empty trait and accommodation arrays", () => {
    render(
      <AttendeesList
        attendees={[
          makeAttendee({
            prosocialTraits: [],
            antisocialTraits: [],
            constraints: [],
          }),
        ]}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("shows peer tutor and separateIds counts with names in the title", () => {
    const maya = makeAttendee({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Maya Chen",
      togetherIds: ["22222222-2222-4222-8222-222222222222"],
      separateIds: ["33333333-3333-4333-8333-333333333333"],
    });
    const sam = makeAttendee({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Sam Patel",
    });
    const jordan = makeAttendee({
      id: "33333333-3333-4333-8333-333333333333",
      name: "Jordan Lee",
    });

    render(<AttendeesList attendees={[maya, sam, jordan]} />);

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
