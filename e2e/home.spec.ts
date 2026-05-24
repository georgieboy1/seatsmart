import { test, expect } from "@playwright/test";

test("home page renders the SeatSmart heading and Get started button", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /seatsmart/i, level: 1 })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /get started/i })
  ).toBeVisible();
});
