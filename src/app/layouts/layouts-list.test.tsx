import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LayoutsList } from "./layouts-list";
import type { ClassroomLayout } from "@/lib/types/layout";

function makeLayout(
  overrides: Partial<ClassroomLayout> = {},
): ClassroomLayout {
  return {
    id: "layout-1",
    userId: "user-1",
    name: "Room 12",
    type: "traditional",
    rows: 5,
    columns: 6,
    numGroups: null,
    studentsPerGroup: null,
    grid: [["seat"]],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("LayoutsList", () => {
  it("shows an empty state when there are no layouts", () => {
    render(<LayoutsList layouts={[]} />);
    expect(screen.getByText(/no layouts yet/i)).toBeInTheDocument();
  });

  it("renders one linked card per layout", () => {
    render(
      <LayoutsList
        layouts={[
          makeLayout({ id: "a", name: "Room A" }),
          makeLayout({ id: "b", name: "Room B" }),
        ]}
      />,
    );
    expect(
      screen.getByRole("link", { name: /room a/i }),
    ).toHaveAttribute("href", "/layouts/a");
    expect(
      screen.getByRole("link", { name: /room b/i }),
    ).toHaveAttribute("href", "/layouts/b");
  });

  it("shows traditional dimensions in the subtitle", () => {
    render(
      <LayoutsList
        layouts={[makeLayout({ name: "Trad", rows: 5, columns: 6 })]}
      />,
    );
    expect(screen.getByText(/5 × 6 traditional/i)).toBeInTheDocument();
  });

  it("shows groups counts in the subtitle", () => {
    render(
      <LayoutsList
        layouts={[
          makeLayout({
            name: "Pods",
            type: "groups",
            rows: null,
            columns: null,
            numGroups: 4,
            studentsPerGroup: 4,
          }),
        ]}
      />,
    );
    expect(screen.getByText(/4 groups of 4/i)).toBeInTheDocument();
  });
});
