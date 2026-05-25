import { test, expect } from "@playwright/test";

test("full happy path: login, cohort, student, layout, chart", async ({ page }) => {
  // 1. Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");

  // 2. Create Cohort
  const cohortName = `Test Cohort ${Date.now()}`;
  await page.fill('input[placeholder="New cohort name..."]', cohortName);
  await page.click('button:has-text("Add")');
  await expect(page.locator("body")).toContainText("Cohort created successfully");
  await expect(page.locator("body")).toContainText(cohortName);

  // 3. Create Student
  await page.goto("/students");
  await page.click('button:has-text("Add Student")');
  const studentName = "John Doe";
  await page.fill('input[id="student-name"]', studentName);
  // Select the cohort
  await page.selectOption('select[id="student-cohort"]', { label: cohortName });
  await page.click('button:has-text("Add student")');
  await expect(page.locator("body")).toContainText(studentName);

  // 4. Create Layout (if not exists, or use existing)
  // For this test, we'll assume the user might have layouts or we create a default one
  await page.goto("/layouts");
  await page.click('button:has-text("New Layout")');
  const layoutName = `Layout ${Date.now()}`;
  await page.fill('input[name="name"]', layoutName);
  await page.click('button:has-text("Save Layout")');
  await expect(page.locator("body")).toContainText(layoutName);

  // 5. Generate Chart
  await page.goto("/dashboard");
  await page.click('a:has-text("Generate Chart")');
  
  // Step 1: Pick Layout
  await page.click(`text=${layoutName}`);
  
  // Step 2: Pick Cohort
  await page.click(`text=${cohortName}`);

  // Chart View
  await expect(page.locator("body")).toContainText(studentName);
  await expect(page.locator("body")).toContainText(layoutName);

  // Generate
  await page.click('button:has-text("Generate Seating Chart")');
  await expect(page.locator("body")).toContainText("Score");

  // Save
  const chartName = `My Chart ${Date.now()}`;
  await page.fill('input[placeholder="Chart name..."]', chartName);
  await page.click('button:has-text("Save Chart")');
  
  // Verify persistence
  await expect(page).toHaveURL(/\/charts\/.+/);
  await expect(page.locator("body")).toContainText(chartName);
  await page.reload();
  await expect(page.locator("body")).toContainText(studentName);
  await expect(page.locator("body")).toContainText(layoutName);
});
