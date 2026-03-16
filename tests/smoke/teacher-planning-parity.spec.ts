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

  await page.goto("/planning");
  await expect(page.getByRole("heading", { name: "Planning" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Yearly plans" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Planning insights" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Curriculum maps" })).toBeVisible();

  await page.getByRole("button", { name: /Create/i }).click();
  await expect(page.getByRole("dialog", { name: /Create plan/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Unit plan" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Lesson plan" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create$/ })).toBeDisabled();

  await page.getByRole("radio", { name: "Unit plan" }).click();
  await page.getByRole("combobox", { name: /Linked class/i }).click();
  await page.getByRole("option", { name: /MYP 5 Sciences/i }).click();
  await expect(page.getByRole("button", { name: /Create$/ })).toBeEnabled();
});

test("class planning upgrades expose yearly, unit, lessons, and insight subviews with shared unit counts", async ({
  page,
}) => {
  await enterTeacher(page);

  await page.goto("/classes/cls_myp_sci?tab=units");
  await expect(page.getByRole("heading", { name: "MYP 5 Sciences" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Year plan" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Unit detail" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Lessons" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Insights" })).toBeVisible();

  await expect(page.getByText("Lesson count").first()).toBeVisible();
  await expect(page.getByText("Assessment count").first()).toBeVisible();
  await expect(page.getByText("Collaborators").first()).toBeVisible();

  await page.getByRole("tab", { name: "Unit detail" }).click();
  await expect(page.getByRole("tab", { name: "Inquiry & action" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Unit flow" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Evidence" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Reflection" })).toBeVisible();
});
