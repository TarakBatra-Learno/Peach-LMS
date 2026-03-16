import { expect, test, type Page } from "@playwright/test";

async function openEntry(page: Page) {
  await page.goto("/enter");
  await expect(page.getByRole("button", { name: "Enter as Teacher" })).toBeVisible();
}

async function selectPersonaOption(page: Page, triggerText: RegExp, optionName: RegExp) {
  await page.getByText(triggerText).click();
  await page.getByRole("option", { name: optionName }).click();
}

async function enterTeacher(page: Page) {
  await openEntry(page);
  await page.getByRole("button", { name: "Enter as Teacher" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function enterStudent(page: Page, studentName: RegExp) {
  await openEntry(page);
  await selectPersonaOption(page, /Choose a student/i, studentName);
  await expect(page.getByRole("button", { name: "Enter as Student" })).toBeEnabled();
  await page.getByRole("button", { name: "Enter as Student" }).click();
  await expect(page).toHaveURL(/\/student\/home$/);
}

test("teacher class standards view and student profile surface mastery context", async ({ page }) => {
  await enterTeacher(page);

  await page.goto("/classes/cls_myp_sci?tab=standards");
  await expect(page.getByRole("heading", { name: "MYP 5 Sciences" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Standards & Skills" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Subject standards" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ATL & learner attributes" })).toBeVisible();

  await page.goto("/students/stu_01?classId=cls_myp_sci");
  await expect(page.getByRole("heading", { name: "Aarav Patel" })).toBeVisible();
  await expect(page.getByText("Mastery overview")).toBeVisible();
  await expect(page.getByText("Latest AI assessment highlights")).toBeVisible();
  await expect(page.getByText("Report readiness")).toBeVisible();
});

test("teacher report detail shows source attribution for assessments and AI suggestions", async ({ page }) => {
  await enterTeacher(page);

  await page.goto("/reports/rpt_131?cycleId=rc_t2");
  await expect(page.getByRole("heading", { name: "Aarav Patel" })).toBeVisible();
  await expect(page.getByText("Report evidence sources")).toBeVisible();
  await expect(page.getByText("Suggested from assessment reports")).toBeVisible();
  await expect(page.getByText("Teacher-authored sections")).toBeVisible();
});

test("student progress and report detail show released mastery and assessment context", async ({ page }) => {
  await enterStudent(page, /^Aarav Patel/);

  await page.goto("/student/progress");
  await expect(page.getByRole("heading", { name: "My Progress" })).toBeVisible();
  await page.getByRole("tab", { name: "Learning Goals" }).click();
  await expect(page.getByText("Released mastery context")).toBeVisible();
  await expect(page.getByText("Assessment insights")).toBeVisible();

  await page.getByRole("tab", { name: "Reports" }).click();
  await page.locator('a[href*="/student/progress/reports/"]').first().click();
  await expect(page).toHaveURL(/\/student\/progress\/reports\/rpt_/);
  await expect(page.getByText("Assessment signals feeding this report")).toBeVisible();
  await expect(page.getByText("Suggested from released assessment feedback")).toBeVisible();
});
