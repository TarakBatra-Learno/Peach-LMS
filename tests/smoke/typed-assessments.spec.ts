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

  await expect(page.getByRole("link", { name: "Field Investigation Report" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Practical Observation Conference" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Systems Check Quiz" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ecosystem Reasoning Chat" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scientific Argument Essay" })).toBeVisible();

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
  await expect(page.getByRole("tab", { name: "Release" })).toHaveCount(0);
  await expect(page.getByText("Quiz", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Formative", { exact: true }).first()).toBeVisible();

  await page.goto("/assessments/asmt_typed_offline");
  await expect(page.getByRole("heading", { name: "Practical Observation Conference" })).toBeVisible();
  await expect(page.getByText("Off-platform", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Offline mode", { exact: true }).first()).toBeVisible();
});

test("teacher can preview a submission and open the dedicated marking workspace from the queue", async ({
  page,
}) => {
  await enterTeacher(page);

  await page.goto("/assessments/asmt_typed_offplatform");
  await page.getByRole("tab", { name: "Submissions" }).click();

  const meiRow = page.getByRole("row", { name: /Mei Chen/i });
  await expect(meiRow.getByRole("button", { name: "View work" })).toBeVisible();
  await meiRow.getByRole("button", { name: "View work" }).click();
  await expect(page.getByRole("dialog", { name: /Mei Chen/i })).toBeVisible();
  await page.getByRole("button", { name: /Open marking workspace/i }).click();

  await expect(page).toHaveURL(/\/assessments\/asmt_typed_offplatform\/students\/[^/]+$/);
  await expect(page.getByRole("heading", { name: /Marking workspace/i })).toBeVisible();
  await expect(page.getByText("Submission evidence")).toBeVisible();
  await expect(page.getByText("Assessment report", { exact: true })).toBeVisible();
});

test("teacher can create a typed assessment from the queue and land in its builder", async ({
  page,
}) => {
  await enterTeacher(page);

  await page.goto("/assessments");
  await page.getByRole("button", { name: "Create assessment" }).click();

  const dialog = page.getByRole("dialog", { name: "Create assessment" });
  await expect(dialog).toBeVisible();

  await dialog.getByPlaceholder("e.g. Unit 3 Quiz").fill("Demo Typed Quiz");
  await dialog.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: "MYP 5 Sciences" }).click();
  await expect(dialog.getByRole("combobox").nth(1)).toContainText("Leave standalone");
  await dialog.getByRole("combobox").nth(2).click();
  await page.getByRole("option", { name: "Quiz" }).click();
  await dialog.locator('input[type="date"]').fill("2026-03-18");

  await dialog.getByRole("button", { name: "Create & open builder" }).click();

  await expect(page).toHaveURL(/\/assessments\/asmt_/);
  await expect(page.getByRole("heading", { name: "Demo Typed Quiz" })).toBeVisible();
  await expect(page.getByText("Standalone assessment")).toBeVisible();
  await expect(page.getByText("Quiz setup")).toBeVisible();
});

test("teacher can create a unit-linked assessment from unit content and keep unit context in the builder", async ({
  page,
}) => {
  await enterTeacher(page);

  await page.goto("/planning/units/unit_01");
  await page.getByRole("tab", { name: "Unit content" }).click();
  await page.getByRole("tab", { name: "Assessments" }).click();
  await page.getByRole("button", { name: "Create assessment" }).click();

  await expect(page).toHaveURL(/\/assessments\?createFor=cls_myp_sci&unitId=unit_01$/);

  const dialog = page.getByRole("dialog", { name: "Create assessment" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Creating for unit: Ecosystems & Interdependence")).toBeVisible();
  await expect(dialog.getByRole("combobox").nth(0)).toContainText("MYP 5 Sciences");
  await expect(dialog.getByRole("combobox").nth(1)).toContainText(
    "Ecosystems & Interdependence"
  );

  await dialog.getByPlaceholder("e.g. Unit 3 Quiz").fill("Unit-linked energy check");
  await dialog.getByRole("combobox").nth(2).click();
  await page.getByRole("option", { name: "Quiz" }).click();
  await dialog.locator('input[type="date"]').fill("2026-03-19");
  await dialog.getByRole("button", { name: "Create & open builder" }).click();

  await expect(page).toHaveURL(/\/assessments\/asmt_/);
  await expect(page.getByRole("heading", { name: "Unit-linked energy check" })).toBeVisible();
  await expect(page.getByText("Unit: Ecosystems & Interdependence")).toBeVisible();
  await expect(
    page.getByText("This assessment is currently linked to Ecosystems & Interdependence.")
  ).toBeVisible();

  await page.goto("/planning/units/unit_01");
  await page.getByRole("tab", { name: "Unit content" }).click();
  await page.getByRole("tab", { name: "Assessments" }).click();
  await expect(page.getByRole("link", { name: "Unit-linked energy check" })).toBeVisible();
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
  await expect(page.getByText("Quiz", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Quiz runner")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit quiz" })).toBeVisible();
  await expect(page.getByText("Assessment report")).toHaveCount(0);

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_chat");
  await expect(page.getByRole("heading", { name: "Ecosystem Reasoning Chat" })).toBeVisible();
  await expect(page.getByText("Chat", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conversation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send response" })).toBeVisible();
  await page.getByPlaceholder("Continue the conversation").fill(
    "The invasive species also changes which organisms can access the same food source."
  );
  await page.getByRole("button", { name: "Send response" }).click();
  await page.getByRole("button", { name: "Submit conversation" }).click();
  await expect(page.getByText("Submitted", { exact: true }).first()).toBeVisible();

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_essay");
  await expect(page.getByRole("heading", { name: "Scientific Argument Essay" })).toBeVisible();
  await expect(page.getByText("Essay", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Essay editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit essay" })).toBeVisible();

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_offline");
  await expect(page.getByRole("heading", { name: "Practical Observation Conference" })).toBeVisible();
  await expect(page.getByText("Offline mode", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Completed off-platform")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_offplatform");
  await expect(page.getByRole("heading", { name: "Field Investigation Report" })).toBeVisible();
  await expect(page.getByText("Assessment report")).toBeVisible();
  await expect(page.getByText("Strengths")).toBeVisible();
  await expect(page.getByText("Suggestions")).toBeVisible();
});

test("releasing a ready assessment outcome also exposes the assessment report to the student", async ({
  page,
}) => {
  await enterTeacher(page);

  await page.goto("/assessments/asmt_typed_offplatform");
  await page.getByRole("tab", { name: "Submissions" }).click();
  await page
    .getByRole("row", { name: /Mei Chen/i })
    .getByRole("button", { name: /Open marking workspace/i })
    .click();
  await expect(page).toHaveURL(/\/assessments\/asmt_typed_offplatform\/students\/[^/]+$/);
  await page.getByRole("button", { name: "Release outcome" }).click();

  await openEntry(page);
  await selectPersonaOption(page, /Choose a student/i, /^Mei Chen/);
  await page.getByRole("button", { name: "Enter as Student" }).click();
  await expect(page).toHaveURL(/\/student\/home$/);

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_typed_offplatform");
  await expect(page.getByText("Assessment report")).toBeVisible();
  await expect(page.getByText("Suggestions")).toBeVisible();
});
