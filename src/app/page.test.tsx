import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders the SeatSmart heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /seatsmart/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("renders the Get started button", () => {
    render(<Home />);
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });
});
