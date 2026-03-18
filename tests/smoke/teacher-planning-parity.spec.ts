import { expect, test, type Page } from "@playwright/test";

async function openEntry(page: Page) {
  await page.goto("/enter");
  await expect(page.getByRole("button", { name: "Enter as Teacher" })).toBeVisible();
}

async function enterTeacher(page: Page) {
  await openEntry(page);
  await page.getByRole("button", { name: "Enter as Teacher" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("planning hub exposes yearly plans, insights, curriculum maps, and a class-linked create flow", async ({
  page,
}) => {
  await enterTeacher(page);

  const classScope = page.locator("header").getByRole("combobox").nth(1);
  await classScope.click();
  await page.getByRole("option", { name: /MYP 5 Sciences/i }).click();
  await expect(classScope).toContainText("MYP 5 Sciences");
  await page.getByRole("link", { name: "Planning" }).click();
  await expect(page).toHaveURL(/\/planning$/);
  await expect(page.getByRole("heading", { name: "Planning" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Yearly plans" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Planning insights" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Curriculum maps" })).toBeVisible();
  await expect(page.getByText("MYP 5 Sciences").first()).toBeVisible();
  await expect(page.getByText("DP 1 English").first()).toHaveCount(0);
  await expect(page.getByText("2 units", { exact: true })).toBeVisible();
  await expect(page.getByText("6 lessons", { exact: true })).toBeVisible();
  await expect(page.getByText("8 linked assessments", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Create/i }).click();
  await expect(page.getByRole("dialog", { name: /Create plan/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Unit plan" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Lesson plan" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: /Linked class/i })).toContainText(
    "MYP 5 Sciences"
  );
  await expect(page.getByRole("button", { name: /Create$/ })).toBeEnabled();

  await page.getByRole("radio", { name: "Unit plan" }).click();
  await page.getByLabel("Working title").fill("Demo Planning Unit");
  await page.getByRole("button", { name: /Create$/ }).click();
  await expect(page).toHaveURL(/\/planning\/units\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Demo Planning Unit" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Strategy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Unit content" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Performance" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Reflection" })).toBeVisible();

  await page.goto("/planning");
  await page.getByRole("button", { name: /Create/i }).click();
  await page.getByLabel("Working title").fill("Cancelled Planning Unit");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Cancelled Planning Unit")).toHaveCount(0);
});

test("class planning opens the same dedicated unit route instead of hidden unit workspace state", async ({
  page,
}) => {
  await enterTeacher(page);

  await page.goto("/classes/cls_myp_sci?tab=units");
  await expect(page.getByRole("heading", { name: "MYP 5 Sciences" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Year plan" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Lessons" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Insights" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Unit workspace" })).toHaveCount(0);

  await page.getByRole("button", { name: /Ecosystems & Interdependence/i }).click();
  await expect(page).toHaveURL(/\/planning\/units\/unit_01$/);
  await expect(page.getByRole("tab", { name: "Strategy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Unit content" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Performance" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Reflection" })).toBeVisible();
});

test("planning insights and curriculum maps show distinct seeded views", async ({ page }) => {
  await enterTeacher(page);

  await page.goto("/planning");
  await page.getByRole("tab", { name: "Planning insights" }).click();
  await expect(page.getByRole("button", { name: "Standards & skills coverage" })).toBeVisible();
  await page.getByRole("button", { name: "Timeline & pacing" }).click();
  await expect(page.getByRole("columnheader", { name: "Assessment load" })).toBeVisible();

  await page.getByRole("tab", { name: "Curriculum maps" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Approaches to learning" })
  ).toBeVisible();
  await expect(page.getByText("Assessment load")).toHaveCount(0);
});
