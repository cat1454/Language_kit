import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";

test("feedback 500 shows an error without creating feedback UI or retry drill", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await routeDetail(page, { listeningSaved: true, feedbackSaved: false, retryCompleted: false });
  await page.route("**/api/feedback", (route) => route.fulfill({
    status: 500,
    json: { error: "Database unavailable." }
  }));

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: "4. Writing" }).click();
  await page.getByLabel("Your writing solution").fill("Sorry for the inconvenience. Would Friday at 3 work for you?");
  await page.getByRole("button", { name: "Prepare feedback prompt" }).click();
  await page.getByLabel("Feedback JSON response").fill(JSON.stringify(validFeedback));
  await page.getByRole("button", { name: "Validate and save feedback" }).click();

  await expect(page.getByText("Database unavailable.")).toBeVisible();
  await expect(page.getByTestId("feedback-result")).toHaveCount(0);
  await page.getByRole("button", { name: "5. Review" }).click();
  await expect(page.getByText(validFeedback.retry_drill.instruction)).toHaveCount(0);
});

test("retry completion 500 shows an error and does not mark the drill complete", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await routeDetail(page, { listeningSaved: true, feedbackSaved: true, retryCompleted: false });
  await page.route("**/api/retry-drills/7/complete", (route) => route.fulfill({
    status: 500,
    json: { error: "Database unavailable." }
  }));

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: "5. Review" }).click();
  await page.getByLabel("Your corrected statement").first().fill("The meeting is moved to Friday at 3.");
  await page.getByRole("button", { name: "Submit correction" }).first().click();

  await expect(page.getByText("Database unavailable.")).toBeVisible();
  await expect(page.getByText("Completed")).toHaveCount(0);
});

test("missing demo lesson still shows the offline warning after initial 5xx", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.clear());
  await page.route("**/api/lesson-packs/999", (route) => route.fulfill({
    status: 503,
    json: { error: "Database unavailable." }
  }));

  await page.goto("/lessons/999");

  await expect(page.getByTestId("demo-mode-notice")).toContainText("Offline demo mode");
  await expect(page.getByRole("button", { name: "Retry backend" })).toBeVisible();
  await expect(page.getByText("Lesson not found.")).toBeVisible();
});

async function routeDetail(page: Page, state: DetailState) {
  await page.route("**/api/lesson-packs/42", (route) => route.fulfill({
    json: { detail: buildDetail(state) }
  }));
}

type DetailState = {
  listeningSaved: boolean;
  feedbackSaved: boolean;
  retryCompleted: boolean;
};

const lessonListItem = {
  id: 42,
  status: "accepted",
  topic: validLessonPack.topic,
  cefrLevel: validLessonPack.cefr_level,
  situation: validLessonPack.situation,
  createdAt: "2026-07-05T00:00:00.000Z"
};

function buildDetail(state: DetailState) {
  return {
    lessonPack: {
      id: 42,
      status: "accepted",
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      validatedJson: validLessonPack,
      createdAt: lessonListItem.createdAt
    },
    lesson: validLessonPack,
    listeningInputId: 5,
    listeningAttempts: state.listeningSaved ? [{
      id: 99,
      lessonPackId: 42,
      gistAnswers: ["To reschedule a workplace meeting."],
      detailAnswers: ["Because of a scheduling conflict.", "Friday at 3."],
      keyPhraseAnswers: ["Could we reschedule it?"],
      replayCount: 1,
      scoreGist: 1,
      scoreDetail: 1,
      scoreKeyPhrase: 1,
      missedDetails: [],
      createdAt: lessonListItem.createdAt
    }] : [],
    retryDrills: [
      {
        id: 7,
        lessonPackId: 42,
        instruction: "Identify the proposed time.",
        items: ["Friday at 3"],
        learnerResult: state.retryCompleted ? "The meeting is moved to Friday at 3." : null,
        completedAt: state.retryCompleted ? lessonListItem.createdAt : null
      },
      ...(state.feedbackSaved ? [{
        id: 8,
        lessonPackId: 42,
        instruction: validFeedback.retry_drill.instruction,
        items: validFeedback.retry_drill.items,
        learnerResult: null,
        completedAt: null
      }] : [])
    ]
  };
}
