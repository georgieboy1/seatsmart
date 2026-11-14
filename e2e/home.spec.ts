import { test, expect } from "@playwright/test";

test("a teacher can go from the home page to a saved chart with no account", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/syndesk · free classroom seating chart generator/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /log in|sign up/i })).toHaveCount(0);

  await page.getByRole("button", { name: /try it with a sample class/i }).click();
  await expect(page).toHaveURL(/\/charts\/new\/?\?layoutId=/);

  await page.getByRole("button", { name: /generate seating chart|regenerate/i }).click();
  await expect(page.getByText(/placed:\s*24/i)).toBeVisible();

  await page.getByLabel(/Honor accommodations/i).uncheck();
  await expect(page.getByText(/This chart has not been checked with the current settings/)).toBeVisible();
  await page.getByRole("button", { name: /generate seating chart|regenerate/i }).click();
  await expect(page.getByText(/This chart has not been checked with the current settings/)).toHaveCount(0);
  await page.getByRole("button", { name: /save chart/i }).click();
  await expect(page).toHaveURL(/\/charts\/view\/?\?id=/);

  // Everything lives in localStorage, so a full reload must bring it back.
  await page.reload();
  await expect(page.getByText("Amara Okafor")).toBeVisible();
  await expect(page.getByText(/This chart has not been checked with the current settings/)).toBeVisible();
  await expect(page.getByText("All constraints satisfied.")).toHaveCount(0);
  await page.getByRole("button", {name: "Export", exact: true}).click();
  let warning = "";
  page.once("dialog", async dialog => { warning = dialog.message(); await dialog.dismiss(); });
  await page.getByRole("menuitem", {name: "Export as CSV"}).click();
  expect(warning).toContain("share only with authorized people");

  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /download backup/i })).toBeVisible();
});
