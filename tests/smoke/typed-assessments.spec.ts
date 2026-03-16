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

test("teacher assessments behave like a cross-class typed work queue", async ({ page }) => {
  await enterTeacher(page);

  await page.goto("/assessments");
  await expect(page.getByRole("heading", { name: "Assessments" })).toBeVisible();
  await expect(page.getByText("Cross-class work queue")).toBeVisible();

  await expect(page.getByText("Field Investigation Report")).toBeVisible();
  await expect(page.getByText("Practical Observation Conference")).toBeVisible();
  await expect(page.getByText("Systems Check Quiz")).toBeVisible();
  await expect(page.getByText("Ecosystem Reasoning Chat")).toBeVisible();
  await expect(page.getByText("Scientific Argument Essay")).toBeVisible();

  await expect(page.getByText("Off-platform").first()).toBeVisible();
  await expect(page.getByText("Quiz").first()).toBeVisible();
  await expect(page.getByText("Chat").first()).toBeVisible();
  await expect(page.getByText("Essay").first()).toBeVisible();
  await expect(page.getByText("Formative").first()).toBeVisible();
  await expect(page.getByText("Summative").first()).toBeVisible();

  await page.goto("/assessments/asmt_typed_quiz");
  await expect(page.getByRole("heading", { name: "Systems Check Quiz" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Submissions" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Insights" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Release" })).toBeVisible();
  await expect(page.getByText("Quiz")).toBeVisible();
  await expect(page.getByText("Formative")).toBeVisible();

  await page.goto("/assessments/asmt_typed_offline");
  await expect(page.getByRole("heading", { name: "Practical Observation Conference" })).toBeVisible();
  await expect(page.getByText("Off-platform")).toBeVisible();
  await expect(page.getByText("Offline mode")).toBeVisible();
});

test("student runners differ by typed assessment and respect release gating", async ({ page }) => {
  await enterStudent(page, /^Aarav Patel/);

  await page.goto("/student/assessments");
  await expect(page.getByRole("heading", { name: "Assessments" })).toBeVisible();
  await expect(page.getByText("Systems Check Quiz")).toBeVisible();
  await expect(page.getByText("Ecosystem Reasoning Chat")).toBeVisible();
  await expect(page.getByText("Scientific Argument Essay")).toBeVisible();

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_quiz");
  await expect(page.getByRole("heading", { name: "Systems Check Quiz" })).toBeVisible();
  await expect(page.getByText("Quiz")).toBeVisible();
  await expect(page.getByText("Quiz runner")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit quiz" })).toBeVisible();
  await expect(page.getByText("Assessment report")).toHaveCount(0);

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_chat");
  await expect(page.getByRole("heading", { name: "Ecosystem Reasoning Chat" })).toBeVisible();
  await expect(page.getByText("Chat")).toBeVisible();
  await expect(page.getByText("Conversation")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send response" })).toBeVisible();

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_essay");
  await expect(page.getByRole("heading", { name: "Scientific Argument Essay" })).toBeVisible();
  await expect(page.getByText("Essay")).toBeVisible();
  await expect(page.getByText("Essay editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit essay" })).toBeVisible();

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_offline");
  await expect(page.getByRole("heading", { name: "Practical Observation Conference" })).toBeVisible();
  await expect(page.getByText("Offline mode")).toBeVisible();
  await expect(page.getByText("Completed off-platform")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_offplatform");
  await expect(page.getByRole("heading", { name: "Field Investigation Report" })).toBeVisible();
  await expect(page.getByText("Assessment report")).toBeVisible();
  await expect(page.getByText("Strengths")).toBeVisible();
  await expect(page.getByText("Suggestions")).toBeVisible();
});
