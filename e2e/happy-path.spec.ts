import { test, expect } from "@playwright/test";

test("full happy path: login, class, student, layout, chart", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  test.skip(
    !email || !password,
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run the authenticated happy path.",
  );

  // 1. Login
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");

  // 2. Create Class
  const className = `Test Class ${Date.now()}`;
  await page.fill('input[placeholder="New class name..."]', className);
  await page.click('button:has-text("Add")');
  await expect(page.locator("body")).toContainText("Class created successfully");
  await expect(page.locator("body")).toContainText(className);

  // 3. Create Student
  await page.goto("/students");
  await page.click('button:has-text("Add Student")');
  const studentName = "John Doe";
  await page.fill('input[id="student-name"]', studentName);
  // Select the class
  await page.selectOption('select[id="student-class"]', { label: className });
  await page.click('button:has-text("Add student")');
  await expect(page.locator("body")).toContainText(studentName);

  // 4. Create Layout
  await page.goto("/layouts");
  await page.click('button:has-text("New Layout")');
  const layoutName = `Layout ${Date.now()}`;
  await page.fill('input[name="name"]', layoutName);
  await page.click('button:has-text("Save")');
  await expect(page.locator("body")).toContainText(layoutName);

  // 5. Generate Chart
  await page.goto("/dashboard");
  await page.click('a:has-text("Generate Chart")');
  
  // Step 1: Pick Layout
  await page.click(`text=${layoutName}`);
  
  // Step 2: Pick Class
  await page.click(`text=${className}`);

  // Chart View
  await expect(page.locator("body")).toContainText(studentName);
  await expect(page.locator("body")).toContainText(layoutName);

  // Generate
  await page.click('button:has-text("Generate Seating Chart")');
  await expect(page.locator("body")).toContainText("Report");

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
