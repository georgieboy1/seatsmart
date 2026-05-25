import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LayoutBuilder } from "./layout-builder";
import type { ClassroomLayout } from "@/lib/types/layout";

function makeTraditional(): ClassroomLayout {
  return {
    id: "l1",
    userId: "u1",
    name: "Room 12",
    type: "traditional",
    rows: 5,
    columns: 6,
    numGroups: null,
    studentsPerGroup: null,
    grid: [
      ["perimeter", "perimeter", "perimeter"],
      ["perimeter", "seat", "perimeter"],
      ["perimeter", "perimeter", "perimeter"],
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  };
}

function makeGroups(): ClassroomLayout {
  return {
    ...makeTraditional(),
    type: "groups",
    rows: null,
    columns: null,
    numGroups: 4,
    studentsPerGroup: 4,
  };
}

describe("LayoutBuilder", () => {
  it("shows the layout name in an input", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);
    expect(screen.getByLabelText(/layout name/i)).toHaveValue("Room 12");
  });

  it("shows rows and columns inputs for Traditional layouts", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);
    expect(screen.getByLabelText(/rows/i)).toHaveValue(5);
    expect(screen.getByLabelText(/columns/i)).toHaveValue(6);
  });

  it("shows groups inputs for Groups layouts", () => {
    render(<LayoutBuilder layout={makeGroups()} />);
    expect(screen.getByLabelText(/groups \(1/i)).toHaveValue(4);
    expect(screen.getByLabelText(/students per group/i)).toHaveValue(4);
  });

  it("renders one gridcell per cell in the grid", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);
    expect(screen.getAllByRole("gridcell")).toHaveLength(9);
  });

  it("renders the legend with multiple cell types", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);
    expect(screen.getByText(/^seat$/i)).toBeInTheDocument();
    expect(screen.getByText(/teacher desk/i)).toBeInTheDocument();
    expect(screen.getByText(/charging station/i)).toBeInTheDocument();
  });

  it("marks the active layout-type toggle with aria-pressed", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);
    expect(
      screen.getByRole("button", { name: /^traditional$/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /^groups$/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("advances a perimeter cell through the cycle when clicked", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);

    // (0,0) starts as "perimeter" — fullName is "Wall".
    const wall = screen.getByLabelText(/wall at row 0, column 0/i);
    fireEvent.click(wall);

    // Next in PERIMETER_CYCLE after "perimeter" is "door".
    expect(
      screen.getByLabelText(/door at row 0, column 0/i),
    ).toBeInTheDocument();
  });

  it("toggles an interior seat to empty and back on consecutive clicks", () => {
    render(<LayoutBuilder layout={makeTraditional()} />);

    fireEvent.click(screen.getByLabelText(/seat at row 1, column 1/i));
    fireEvent.click(screen.getByLabelText(/empty at row 1, column 1/i));

    expect(
      screen.getByLabelText(/seat at row 1, column 1/i),
    ).toBeInTheDocument();
  });
});
