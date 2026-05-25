import { test, expect } from "@playwright/test";

test("home page renders the SynDesk heading and auth links", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /syndesk/i, level: 1 })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: /get started/i })
  ).toHaveAttribute("href", "/signup");

  await expect(
    page.getByRole("link", { name: /log in/i })
  ).toHaveAttribute("href", "/login");
});
