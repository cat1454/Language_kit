import { expect, test } from "@playwright/test";

test("dashboard renders the empty review state", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await page.route("**/api/dashboard", (route) => route.fulfill({
    json: {
      summary: {
        completedTopics: 0,
        completedRetryDrills: 0,
        repeatedErrorTypes: {}
      }
    }
  }));
  await page.route("**/api/review-queue?limit=5", (route) => route.fulfill({
    json: {
      items: [],
      summary: { total: 0, urgent: 0, high: 0, normal: 0, low: 0 }
    }
  }));

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Review next" })).toBeVisible();
  await expect(page.getByText("No review items yet. Complete a lesson, feedback, or retry drill to build your queue.")).toBeVisible();
});

test("dashboard renders seeded review items with lesson links", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await page.route("**/api/dashboard", (route) => route.fulfill({
    json: {
      summary: {
        completedTopics: 1,
        completedRetryDrills: 0,
        repeatedErrorTypes: { naturalness: 1 }
      }
    }
  }));
  await page.route("**/api/review-queue?limit=5", (route) => route.fulfill({
    json: {
      items: [{
        id: "retry_drill:7",
        sourceType: "retry_drill",
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        title: "Retry polite meeting request",
        reason: "Feedback created an unfinished retry drill.",
        priority: 4,
        actionType: "retry_drill",
        sourceUpdatedAt: "2026-07-06T12:00:00.000Z",
        evidenceSnippet: "I want change meeting.",
        completed: false
      }],
      summary: { total: 1, urgent: 1, high: 0, normal: 0, low: 0 }
    }
  }));

  await page.goto("/dashboard");

  await expect(page.getByText("Urgent", { exact: true })).toBeVisible();
  await expect(page.getByText("Feedback created an unfinished retry drill.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Retry polite meeting request" })).toHaveAttribute("href", "/lessons/42");
});
