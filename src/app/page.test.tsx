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

  it("links Get started to /signup", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: /get started/i });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("links Log in to /login", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
