import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

test("listening panel renders real audio without revealing the transcript", async ({ page }) => {
  let listeningSaved = false;
  let listeningPayload: Record<string, unknown> | null = null;
  await routeDetail(page, "/audio/lessons/42.mp3", () => listeningSaved);
  await page.route("**/api/listening-attempts", async (route) => {
    listeningPayload = route.request().postDataJSON();
    listeningSaved = true;
    await route.fulfill({ status: 201, json: { attempt: { id: 99, ...listeningPayload } } });
  });

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();

  const audio = page.getByTestId("lesson-audio-player");
  await expect(audio).toBeVisible();
  await expect(audio).toHaveAttribute("src", "/audio/lessons/42.mp3");
  await expect(page.getByTestId("demo-listening-player")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Unlocked Transcript" })).toHaveCount(0);
  await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).playbackRate)).toBe(1);

  await fillListeningCheck(page);
  await page.getByRole("button", { name: "Verify & save" }).click();

  await expect(page.getByRole("heading", { name: "Unlocked Transcript" })).toBeVisible();
  expect(listeningPayload).not.toHaveProperty("listeningInputId");
});

test("listening panel keeps the demo fallback when audio is missing", async ({ page }) => {
  await routeDetail(page, null, () => false);

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();

  await expect(page.getByTestId("demo-listening-player")).toBeVisible();
  await expect(page.getByText("No lesson audio yet. Using demo listening timer.")).toBeVisible();
  await expect(page.getByTestId("lesson-audio-player")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Unlocked Transcript" })).toHaveCount(0);
});

async function routeDetail(
  page: Page,
  audioPath: string | null,
  hasAttempt: () => boolean
) {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await page.route("**/api/lesson-packs/42", (route) => route.fulfill({
    json: { detail: buildDetail(audioPath, hasAttempt()) }
  }));
}

async function fillListeningCheck(page: Page) {
  await page.getByLabel("What is the main purpose of the conversation?").fill("To reschedule a workplace meeting.");
  await page.getByLabel("Why does the speaker need to move the meeting?").fill("Because of a scheduling conflict.");
  await page.getByLabel("What new time is suggested?").fill("Friday at 3.");
  await page.getByLabel("Type the phrase you heard").fill("Could we reschedule it?");
}

function buildDetail(audioPath: string | null, hasAttempt: boolean) {
  return {
    lessonPack: {
      id: 42,
      status: "accepted",
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      validatedJson: validLessonPack,
      createdAt: "2026-07-05T00:00:00.000Z"
    },
    lesson: validLessonPack,
    listeningInputId: 5,
    listeningInput: { id: 5, audioPath },
    listeningAttempts: hasAttempt ? [{
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
      createdAt: "2026-07-05T00:00:00.000Z"
    }] : [],
    roleplayTurns: [],
    writingSubmission: null,
    retryDrills: []
  };
}
