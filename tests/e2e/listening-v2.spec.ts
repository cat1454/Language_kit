import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

test("speed and voice controls update the real audio element only when metadata exists", async ({ page }) => {
  await routeDetail(page, buildAudioMetadata());

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();

  const audio = page.getByTestId("lesson-audio-player");
  await page.getByLabel("Playback speed").selectOption("0.75");
  await expect.poll(() => audio.evaluate((node) => (node as HTMLAudioElement).playbackRate)).toBe(0.75);

  await expect(page.getByLabel("Voice")).toBeVisible();
  await page.getByLabel("Voice").selectOption("bright");
  await expect(audio).toHaveAttribute("src", "/audio/lessons/42-bright.mp3");
});

test("voice selector stays hidden when no variants are available", async ({ page }) => {
  await routeDetail(page, null);

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();

  await expect(page.getByTestId("lesson-audio-player")).toBeVisible();
  await expect(page.getByLabel("Voice")).toHaveCount(0);
});

test("chunk replay seeks to timed chunks and missing timings show a safe message", async ({ page }) => {
  await routeDetail(page, buildAudioMetadata());

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();

  const audio = page.getByTestId("lesson-audio-player");
  await audio.evaluate((node) => {
    Reflect.set(window, "__pauseCalls", 0);
    Object.defineProperty(node, "paused", { configurable: true, value: true });
    Object.defineProperty(node, "play", {
      configurable: true,
      value: () => Promise.resolve()
    });
    Object.defineProperty(node, "pause", {
      configurable: true,
      value: () => {
        Reflect.set(window, "__pauseCalls", Number(Reflect.get(window, "__pauseCalls")) + 1);
      }
    });
  });
  await page.getByRole("button", { name: "Replay chunk 1" }).click();

  await expect.poll(() => audio.evaluate((node) => Math.round((node as HTMLAudioElement).currentTime * 1000))).toBe(1000);
  await audio.evaluate((node) => {
    (node as HTMLAudioElement).currentTime = 3.1;
    node.dispatchEvent(new Event("timeupdate"));
  });
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__pauseCalls"))).toBe(1);
  await expect(page.getByText("Chunk replay needs timing metadata.")).toHaveCount(0);

  await routeDetail(page, { durationMs: 65000 });
  await page.reload();
  await page.getByRole("button", { name: /Listening/ }).click();

  await expect(page.getByText("Chunk replay needs timing metadata.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Replay chunk/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Shadow full audio" })).toBeVisible();
});

test("dictation compare remains gated until the listening check is saved", async ({ page }) => {
  let listeningSaved = false;
  await routeDetail(page, buildAudioMetadata(), () => listeningSaved);
  await page.route("**/api/listening-attempts", async (route) => {
    listeningSaved = true;
    await route.fulfill({ status: 201, json: { attempt: { id: 99, ...route.request().postDataJSON() } } });
  });

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();

  await page.getByLabel("Dictation draft").fill("Could we reschedule it?");
  await expect(page.getByText(validLessonPack.listening_input.script)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Dictation compare" })).toHaveCount(0);

  await fillListeningCheck(page);
  await page.getByRole("button", { name: "Verify & save" }).click();

  await expect(page.getByRole("heading", { name: "Dictation compare" })).toBeVisible();
  await expect(page.getByTestId("dictation-transcript")).toContainText(validLessonPack.listening_input.script);
});

test("shadowing mode never requests microphone permissions", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.set(window, "__micRequested", false);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => {
          Reflect.set(window, "__micRequested", true);
          return Promise.reject(new Error("microphone should not be requested"));
        }
      }
    });
  });
  await routeDetail(page, buildAudioMetadata());

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();
  await page.getByRole("button", { name: "Shadow chunk 1" }).click();

  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__micRequested"))).toBe(false);
});

async function routeDetail(
  page: Page,
  audioMetadata: Record<string, unknown> | null,
  hasAttempt: () => boolean = () => false
) {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await page.route("**/api/lesson-packs/42", (route) => route.fulfill({
    json: { detail: buildDetail(audioMetadata, hasAttempt()) }
  }));
}

async function fillListeningCheck(page: Page) {
  await page.getByLabel("What is the main purpose of the conversation?").fill("To reschedule a workplace meeting.");
  await page.getByLabel("Why does the speaker need to move the meeting?").fill("Because of a scheduling conflict.");
  await page.getByLabel("What new time is suggested?").fill("Friday at 3.");
  await page.getByLabel("Type the phrase you heard").fill("Could we reschedule it?");
}

function buildDetail(audioMetadata: Record<string, unknown> | null, hasAttempt: boolean) {
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
    listeningInput: {
      id: 5,
      audioPath: "/audio/lessons/42-default.mp3",
      audioMetadata
    },
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

function buildAudioMetadata() {
  return {
    defaultVoiceId: "default",
    variants: [
      {
        voiceId: "default",
        label: "Default voice",
        audioPath: "/audio/lessons/42-default.mp3"
      },
      {
        voiceId: "bright",
        label: "Bright voice",
        audioPath: "/audio/lessons/42-bright.mp3"
      }
    ],
    chunkTimings: [
      { chunkIndex: 0, startMs: 1000, endMs: 3000 }
    ],
    durationMs: 65000
  };
}
