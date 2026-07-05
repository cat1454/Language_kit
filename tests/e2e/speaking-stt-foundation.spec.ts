import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

test("manual speaking transcript saves without requesting microphone permission", async ({ page }) => {
  await installRecordingStubs(page);
  await routeDetail(page);
  let speakingPayload: Record<string, unknown> | null = null;
  await page.route("**/api/speaking-attempts", async (route) => {
    speakingPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: { attempt: { id: 81, ...speakingPayload, sttProvider: "manual", sttStatus: "completed" } }
    });
  });

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: "3. Roleplay" }).click();

  await expect(page.getByRole("heading", { name: "Speaking practice" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__micRequested"))).toBe(false);
  await page.getByLabel("Manual speaking transcript").fill("Could we reschedule for Friday?");
  await page.getByRole("button", { name: "Save transcript" }).click();

  expect(speakingPayload).toEqual({
    lessonId: 42,
    promptType: "roleplay",
    promptRef: validLessonPack.roleplay.turns[0].learner_goal,
    transcript: "Could we reschedule for Friday?"
  });
  await expect(page.getByText("Transcript saved.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__micRequested"))).toBe(false);
});

test("recording starts only after a click and never uploads audio", async ({ page }) => {
  await installRecordingStubs(page);
  await routeDetail(page);
  let speakingRequests = 0;
  await page.route("**/api/speaking-attempts", async (route) => {
    speakingRequests += 1;
    await route.fulfill({ status: 201, json: { attempt: { id: 81 } } });
  });

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: "3. Roleplay" }).click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__micRequested"))).toBe(false);

  await page.getByRole("button", { name: "Start local recording" }).click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__micRequested"))).toBe(true);
  await page.getByRole("button", { name: "Stop recording" }).click();

  await expect(page.getByText("Recording ready for local playback. It has not been uploaded.")).toBeVisible();
  await expect(page.getByTestId("local-speaking-recording")).toBeVisible();
  expect(speakingRequests).toBe(0);
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__trackStopped"))).toBe(true);
});

test("manual transcript remains available when recording is unsupported", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "MediaRecorder");
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  });
  await routeDetail(page);

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: "3. Roleplay" }).click();

  await expect(page.getByLabel("Manual speaking transcript")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start local recording" })).toHaveCount(0);
  await expect(page.getByText("Recording is not supported here. You can still type a transcript.")).toBeVisible();
});

async function routeDetail(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await page.route("**/api/lesson-packs/42", (route) => route.fulfill({
    json: { detail: buildDetail() }
  }));
}

async function installRecordingStubs(page: Page) {
  await page.addInitScript(() => {
    Reflect.set(window, "__micRequested", false);
    Reflect.set(window, "__trackStopped", false);
    class FakeMediaRecorder {
      state = "inactive";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["audio"], { type: "audio/webm" }) });
        this.onstop?.();
      }
    }
    Reflect.set(window, "MediaRecorder", FakeMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          Reflect.set(window, "__micRequested", true);
          return {
            getTracks: () => [{
              stop: () => Reflect.set(window, "__trackStopped", true)
            }]
          };
        }
      }
    });
  });
}

function buildDetail() {
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
    listeningAttempts: [],
    roleplayTurns: validLessonPack.roleplay.turns.map((turn, index) => ({
      id: 501 + index,
      lessonPackId: 42,
      turnIndex: index + 1,
      aiPrompt: turn.ai_prompt,
      learnerGoal: turn.learner_goal,
      learnerResponse: null
    })),
    writingSubmission: null,
    retryDrills: []
  };
}
