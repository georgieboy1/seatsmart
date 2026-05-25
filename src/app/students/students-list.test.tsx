import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Student } from "@/lib/types/student";
import { StudentsList } from "./students-list";

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
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("StudentsList", () => {
  it("shows an empty state when there are no students", () => {
    render(<StudentsList students={[]} />);
    expect(screen.getByText(/no students yet/i)).toBeInTheDocument();
  });

  it("renders roster rows with trait and accommodation chips", () => {
    render(
      <StudentsList
        students={[
          makeStudent({
            name: "Maya Chen",
            prosocialTraits: ["helpful", "focused"],
            antisocialTraits: ["talkative"],
            accommodations: ["front_of_room", "near_teacher"],
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
      <StudentsList
        students={[
          makeStudent({
            prosocialTraits: [],
            antisocialTraits: [],
            accommodations: [],
          }),
        ]}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("shows peer tutor and avoid counts with names in the title", () => {
    const maya = makeStudent({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Maya Chen",
      peerTutors: ["22222222-2222-4222-8222-222222222222"],
      avoid: ["33333333-3333-4333-8333-333333333333"],
    });
    const sam = makeStudent({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Sam Patel",
    });
    const jordan = makeStudent({
      id: "33333333-3333-4333-8333-333333333333",
      name: "Jordan Lee",
    });

    render(<StudentsList students={[maya, sam, jordan]} />);

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
