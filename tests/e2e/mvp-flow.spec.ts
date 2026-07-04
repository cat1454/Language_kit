import { expect, test } from "@playwright/test";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

test("learner can generate, paste, validate, and export a lesson pack", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Target language").fill("English");
  await page.getByLabel("Native language").fill("Vietnamese");
  await page.getByLabel("CEFR level").fill("B1");
  await page.getByLabel("Topic").fill("Reschedule a meeting");
  await page
    .getByLabel("Situation")
    .fill("A workplace meeting must be moved because of a scheduling conflict.");
  await page.getByLabel("Session minutes").fill("30");
  await page.getByRole("button", { name: "Generate prompt" }).click();

  await expect(page.getByTestId("prompt-preview")).toContainText("lesson_pack.v1");

  await page.getByLabel("AI JSON response").fill(JSON.stringify(validLessonPack));
  await page.getByRole("button", { name: "Validate and save" }).click();

  await expect(page.getByTestId("validation-status")).toContainText("accepted");
  await expect(
    page.getByRole("link", { name: /Reschedule a meeting/ })
  ).toBeVisible();

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Exports" })
    .click();
  await expect(page.getByRole("heading", { name: "Dataset exports" })).toBeVisible();
});
