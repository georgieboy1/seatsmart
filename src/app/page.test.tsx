import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("names the product and what it does", () => {
    render(<Home />);
    expect(screen.getByText(/syndesk · free classroom seating chart generator/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/seating chart/i);
  });

  it("opens the workspace without an account", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /open syndesk/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: /log in|sign up|get started/i })).toBeNull();
  });

  it("offers a one-click sample class", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /sample class/i })).toBeInTheDocument();
  });

  it("states that student data stays on the device", () => {
    render(<Home />);
    expect(screen.getByText(/student data stays on this device/i)).toBeInTheDocument();
  });
});
