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
  await expect(page).toHaveTitle("Teacher Portal | Peach LMS");
}

async function enterAdmin(page: Page) {
  await openEntry(page);
  await page.getByRole("button", { name: "Enter as Admin" }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page).toHaveTitle("Admin Portal | Peach LMS");
}

async function enterStudent(page: Page, studentName: RegExp) {
  await openEntry(page);
  await selectPersonaOption(page, /Choose a student/i, studentName);
  await expect(page.getByRole("button", { name: "Enter as Student" })).toBeEnabled();
  await page.getByRole("button", { name: "Enter as Student" }).click();
  await expect(page).toHaveURL(/\/student\/home$/);
  await expect(page).toHaveTitle("Student Portal | Peach LMS");
}

async function enterFamily(page: Page, familyName: RegExp) {
  await openEntry(page);
  await selectPersonaOption(page, /Choose a family/i, familyName);
  await expect(page.getByRole("button", { name: "Enter as Family" })).toBeEnabled();
  await page.getByRole("button", { name: "Enter as Family" }).click();
  await expect(page).toHaveURL(/\/family\//);
  await expect(page).toHaveTitle("Family Portal | Peach LMS");
}

test("redirects persona-protected routes to entry without an active persona", async ({ page }) => {
  await page.goto("/student/home");
  await expect(page).toHaveURL(/\/enter$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/enter$/);

  await page.goto("/family/home");
  await expect(page).toHaveURL(/\/enter$/);

  await page.goto("/admin/overview");
  await expect(page).toHaveURL(/\/enter$/);
});

test("teacher dashboard uses the teacher shell and a live demo-day timetable", async ({ page }) => {
  await enterTeacher(page);

  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Classes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Assessments" })).toBeVisible();
  await expect(page.getByText("Planning")).toBeVisible();
  await expect(page.getByRole("combobox").nth(0)).toBeVisible();
  await expect(page.getByRole("combobox").nth(1)).toBeVisible();
  await expect(page.getByRole("combobox").nth(1)).toContainText("All classes");

  await expect(page.getByRole("heading", { name: "Right Now" })).toBeVisible();
  await expect(page.getByText("Take attendance")).toBeVisible();
  await expect(page.getByText("MYP 5 Sciences (09:00–10:00)")).toBeVisible();

  await page.goto("/communication");
  await expect(page).toHaveURL(/\/communication$/);
  await expect(page.getByRole("heading", { name: "Communication" })).toBeVisible();
  await expect(page.getByText("Select a channel")).toHaveCount(0);
  await expect(page.getByText("Channels", { exact: true })).toBeVisible();

  await page.goto("/assessments/asmt_20");
  await expect(page.getByRole("heading", { name: "Lab Safety Assessment" })).toBeVisible();
  await page.getByRole("tab", { name: /Students/ }).click();
  const aaravRow = page.locator("tr", { hasText: "Aarav Patel" });
  await expect(aaravRow.getByRole("button", { name: "View work" })).toBeVisible();
  await aaravRow.getByRole("button", { name: "View work" }).click();
  await expect(page.getByText("Aarav Patel's Submission")).toBeVisible();
  await expect(page.getByText("Draft saved")).toBeVisible();
});

test("teacher shell reset control reseeds the demo safely", async ({ page }) => {
  await enterTeacher(page);

  await page.getByRole("button", { name: /Ms\. Sarah Mitchell/i }).click();
  await page.getByRole("menuitem", { name: "Reset demo data" }).click();

  await expect(page.getByRole("dialog", { name: "Reset demo data" })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();

  await expect(page.getByText("Demo data reset to defaults")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Right Now" })).toBeVisible();
});

test("teacher report publish flow updates immediately without a refresh", async ({ page }) => {
  await enterTeacher(page);

  await page.goto("/reports/cycles/rc_t2");
  await expect(page.getByRole("heading", { name: "Term 2 Reports 2025-2026" })).toBeVisible();

  await page.locator('a[href*="/reports/rpt_"]').first().click();
  await expect(page.getByRole("button", { name: "Auto-fill" })).toBeVisible();

  await page.getByRole("button", { name: "Auto-fill" }).click();
  await page.getByRole("button", { name: "Mark Ready" }).click();

  const markReadyAnyway = page.getByRole("button", { name: "Mark ready anyway" });
  if (await markReadyAnyway.isVisible().catch(() => false)) {
    await markReadyAnyway.click();
  }

  await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();

  await page.getByRole("button", { name: "Publish" }).click();
  await page.getByRole("button", { name: "Publish report" }).click();

  await expect(page.getByRole("button", { name: "Distribute" })).toBeEnabled();
  await expect(page.getByText(/Published [A-Z][a-z]{2} \d{1,2}, \d{4}/)).toBeVisible();
});

test("student assessment views respect draft and grade-release contracts", async ({ page }) => {
  await enterStudent(page, /^Aarav Patel/);

  await page.goto("/student/home");
  await expect(page.getByText("1 upcoming")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Lab Safety Assessment MYP 5 Sciences Draft/i })
  ).toBeVisible();

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_20");
  await expect(page.getByRole("heading", { name: "Lab Safety Assessment" })).toBeVisible();
  await expect(page.locator("main").getByText(/^Draft$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  await expect(page.getByText(/This assessment is past due/i)).toHaveCount(0);

  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_14");
  await expect(page.getByText("Your grade")).toBeVisible();
  await expect(page.getByText("34/40")).toBeVisible();
  await expect(page.getByText("TEACHER FEEDBACK")).toBeVisible();

  await page.goto("/student/messages?startDm=cls_myp_sci");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByText("Select a channel")).toHaveCount(0);
  await expect(page.getByText(/Ms\. Mitchell/).first()).toBeVisible();

  await page.goto("/student/portfolio");
  await expect(page.getByRole("heading", { name: "My Portfolio" })).toBeVisible();
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("button", { name: "Open artifact" })).toBeVisible();
  await expect(page.getByText("Linked goals")).toBeVisible();

  await page.goto("/student/progress");
  await expect(page.getByRole("heading", { name: "My Progress" })).toBeVisible();
  await expect(page.getByText("Latest released result")).toBeVisible();
  await expect(page.getByText("Most recent report")).toBeVisible();

  await enterStudent(page, /^Mei Chen/);
  await page.goto("/student/classes/cls_myp_sci/assessments/asmt_14");
  await expect(page.getByRole("heading", { name: "Physics Problem Set" })).toBeVisible();
  await expect(page.locator("main").getByText(/^Submitted$/).first()).toBeVisible();
  await expect(page.getByText("Your grade")).toHaveCount(0);
  await expect(page.getByText("TEACHER FEEDBACK")).toHaveCount(0);
});

test("family learning stays child-scoped and curriculum-safe", async ({ page }) => {
  await enterFamily(page, /^Chen Family/);

  await page.goto("/family/learning");
  await expect(page.getByText(/A family-facing view of Liam's learning story/i)).toBeVisible();
  await expect(page.getByText(/Choose one child for learning detail/i)).toHaveCount(0);

  await page.getByRole("tab", { name: "Units" }).click();
  await expect(page.getByText("Linked assessments").first()).toBeVisible();
  await expect(page.getByText(/teaching notes/i)).toHaveCount(0);
  await expect(page.getByText(/teacher reflection/i)).toHaveCount(0);
});

test("admin portal exposes the dedicated leadership shell and core overview surfaces", async ({ page }) => {
  await enterAdmin(page);

  await expect(page.getByRole("heading", { name: "School leadership overview" })).toBeVisible();
  await expect(page.getByText("724", { exact: true })).toBeVisible();
  await expect(page.getByText("Leadership alerts")).toBeVisible();

  await page.goto("/admin/curriculum");
  await expect(page.getByRole("heading", { name: "Curriculum oversight" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cross-class visibility" })).toBeVisible();

  await page.goto("/admin/performance");
  await expect(page.getByRole("heading", { name: "Performance oversight" })).toBeVisible();
  await page.getByRole("tab", { name: "Students" }).click();
  await expect(page.getByRole("heading", { name: "Individual student analytics" })).toBeVisible();

  await page.goto("/admin/classes");
  await expect(page.getByRole("heading", { name: "School-wide classes" })).toBeVisible();
  const sciencesRow = page.locator("tr", { hasText: "MYP 5 Sciences" });
  await sciencesRow.getByRole("link", { name: "Open workspace" }).click();
  await expect(page).toHaveURL(/\/admin\/classes\/cls_myp_sci$/);
  await expect(page.getByRole("heading", { name: "MYP 5 Sciences" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Student roster" })).toBeVisible();
  const classFrame = page.frameLocator('iframe[title="Live class view"]');
  await expect(
    classFrame.getByRole("heading", { name: "MYP 5 Sciences" })
  ).toBeVisible();
  await classFrame.getByRole("tab", { name: "Assessments" }).click();
  await classFrame.getByRole("link", { name: /Lab Safety Assessment/i }).first().click();
  await expect(page).toHaveURL(/\/admin\/classes\/cls_myp_sci\/assessments\/asmt_20$/);
  await expect(page.getByRole("heading", { name: "Lab Safety Assessment" })).toBeVisible();
  await expect(
    page.frameLocator('iframe[title="Live assessment detail"]').getByRole("heading", { name: "Lab Safety Assessment" })
  ).toBeVisible();

  await page.goto("/admin/classes/cls_myp_sci");
  await expect(
    page.frameLocator('iframe[title="Live class view"]').getByRole("heading", { name: "MYP 5 Sciences" })
  ).toBeVisible();
  await classFrame.getByRole("link", { name: "Aarav Patel" }).first().click();
  await expect(page).toHaveURL(/\/admin\/students\/stu_01\?classId=cls_myp_sci$/);
  await expect(page.getByRole("heading", { name: "Aarav Patel" })).toBeVisible();
  const studentFrame = page.frameLocator('iframe[title="Live student profile"]');
  await expect(
    studentFrame.getByRole("heading", { name: "Aarav Patel" })
  ).toBeVisible();
  await studentFrame.getByRole("tab", { name: "Reports" }).click();
  await studentFrame.getByRole("link", { name: /Term 1 Reports 2025-2026/i }).first().click();
  await expect(page).toHaveURL(/\/admin\/students\/stu_01\/reports\/rpt_\d+\?classId=cls_myp_sci$/);
  await expect(page.getByRole("heading", { name: "Aarav Patel" })).toBeVisible();
  await expect(
    page.frameLocator('iframe[title="Live report detail"]').getByText(/Report: Aarav Patel/i)
  ).toBeVisible();
});
