import { expect, test } from "@playwright/test";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";

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
    page.getByRole("link", { name: /Reschedule a meeting/ }).first()
  ).toBeVisible();

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Exports" })
    .click();
  await expect(page.getByRole("heading", { name: "Dataset exports" })).toBeVisible();
});

test("learner completes the API-backed learning loop with manual feedback", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.clear());
  let listeningSaved = false;
  let feedbackSaved = false;
  let retryCompleted = false;
  let listeningPayload: Record<string, unknown> | null = null;
  let roleplayPayload: Record<string, unknown> | null = null;
  let writingPayload: Record<string, unknown> | null = null;
  let roleplayResponse: string | null = null;
  let writingDraft: string | null = null;

  await page.route("**/api/lesson-packs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { lessons: [lessonListItem] } });
      return;
    }
    await route.fallback();
  });
  await page.route("**/api/lesson-packs/42", async (route) => {
    await route.fulfill({
      json: {
        detail: buildDetail({
          listeningSaved,
          feedbackSaved,
          retryCompleted,
          roleplayResponse,
          writingDraft
        })
      }
    });
  });
  await page.route("**/api/listening-attempts", async (route) => {
    listeningPayload = route.request().postDataJSON();
    listeningSaved = true;
    await route.fulfill({ status: 201, json: { attempt: { id: 99, ...listeningPayload } } });
  });
  await page.route("**/api/roleplay-turns", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    roleplayPayload = payload;
    roleplayResponse = String(payload.learnerResponse);
    await route.fulfill({
      status: 200,
      json: {
        roleplayTurn: {
          id: 501,
          lessonPackId: 42,
          turnIndex: 1,
          learnerResponse: roleplayResponse
        }
      }
    });
  });
  await page.route("**/api/writing-submissions", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    writingPayload = payload;
    writingDraft = String(payload.draft);
    await route.fulfill({
      status: 200,
      json: {
        writingSubmission: {
          id: 701,
          lessonPackId: 42,
          draft: writingDraft
        }
      }
    });
  });
  await page.route("**/api/feedback", async (route) => {
    feedbackSaved = true;
    await route.fulfill({
      status: 201,
      json: { status: "accepted", feedback: validFeedback, modelOutputId: 2, errorCount: 1, retryDrillId: 8 }
    });
  });
  await page.route("**/api/retry-drills/7/complete", async (route) => {
    retryCompleted = true;
    await route.fulfill({ status: 200, json: { drill: { id: 7, completedAt: new Date().toISOString() } } });
  });
  await page.route("**/api/dashboard", async (route) => {
    await route.fulfill({ json: { summary: { completedTopics: 1, completedRetryDrills: retryCompleted ? 1 : 0, repeatedErrorTypes: feedbackSaved ? { naturalness: 1 } : {} } } });
  });

  await page.goto("/");
  await page.getByRole("link", { name: /Reschedule a meeting/ }).click();
  await page.getByRole("button", { name: /Listening/ }).click();
  await page.getByLabel("What is the main purpose of the conversation?").fill("To reschedule a workplace meeting.");
  await page.getByLabel("Why does the speaker need to move the meeting?").fill("Because of a scheduling conflict.");
  await page.getByLabel("What new time is suggested?").fill("Friday at 3.");
  await page.getByLabel("Type the phrase you heard").fill("Could we reschedule it?");
  await page.getByRole("button", { name: "Verify & save" }).click();

  await expect(page.getByRole("heading", { name: "Unlocked Transcript" })).toBeVisible();
  expect(listeningPayload).not.toHaveProperty("listeningInputId");

  await page.getByRole("button", { name: "3. Roleplay" }).click();
  await page.getByLabel("Roleplay response").fill("I have a scheduling conflict. Could we reschedule?");
  await page.getByRole("button", { name: "Send response" }).click();
  expect(roleplayPayload).toMatchObject({
    lessonId: 42,
    turnId: 501,
    learnerResponse: "I have a scheduling conflict. Could we reschedule?"
  });
  await page.getByRole("button", { name: "4. Writing" }).click();
  await page.getByLabel("Your writing solution").fill("Sorry for the inconvenience. Would Friday at 3 work for you because I have a scheduling conflict?");
  await page.getByRole("button", { name: "Save draft" }).click();
  expect(writingPayload).toMatchObject({
    lessonId: 42,
    writingSubmissionId: 701,
    draft: "Sorry for the inconvenience. Would Friday at 3 work for you because I have a scheduling conflict?"
  });

  await page.reload();
  await page.getByRole("button", { name: "3. Roleplay" }).click();
  await expect(page.getByText("I have a scheduling conflict. Could we reschedule?")).toBeVisible();
  await page.getByRole("button", { name: "4. Writing" }).click();
  await expect(page.getByLabel("Your writing solution")).toHaveValue(
    "Sorry for the inconvenience. Would Friday at 3 work for you because I have a scheduling conflict?"
  );
  await page.getByRole("button", { name: "Prepare feedback prompt" }).click();
  await expect(page.getByTestId("feedback-prompt")).toContainText("scheduling conflict");
  await page.getByLabel("Feedback JSON response").fill(JSON.stringify(validFeedback));
  await page.getByRole("button", { name: "Validate and save feedback" }).click();
  await expect(page.getByTestId("feedback-result")).toBeVisible();

  await page.getByRole("button", { name: "5. Review" }).click();
  await page.getByLabel("Your corrected statement").first().fill("The meeting is moved to Friday at 3.");
  await page.getByRole("button", { name: "Submit correction" }).first().click();
  await expect(page.getByText("Completed").first()).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByText("naturalness")).toBeVisible();
});

test("initial 5xx selects a visible browser-only demo session", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.clear());
  await page.route("**/api/lesson-packs", (route) => route.fulfill({
    status: 503,
    json: { error: "Database unavailable." }
  }));

  await page.goto("/");

  await expect(page.getByTestId("demo-mode-notice")).toContainText("Offline demo mode");
  await expect(page.getByRole("link", { name: /Meeting schedule adjustment/ })).toBeVisible();
});

test("an initial 4xx stays in API mode and never falls back silently", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.clear());
  await page.route("**/api/lesson-packs", (route) => route.fulfill({
    status: 400,
    json: { error: "Invalid request." }
  }));

  await page.goto("/");

  await expect(page.getByText("Invalid request.")).toBeVisible();
  await expect(page.getByTestId("demo-mode-notice")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Meeting schedule adjustment/ })).toHaveCount(0);
});

test("a failed API write keeps the transcript locked and shows the error", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("language_kit_data_source", "api"));
  await page.route("**/api/lesson-packs/42", (route) => route.fulfill({
    json: { detail: buildDetail({ listeningSaved: false, feedbackSaved: false, retryCompleted: false }) }
  }));
  await page.route("**/api/listening-attempts", (route) => route.fulfill({
    status: 500,
    json: { error: "Database unavailable." }
  }));

  await page.goto("/lessons/42");
  await page.getByRole("button", { name: /Listening/ }).click();
  await page.getByLabel("What is the main purpose of the conversation?").fill("To reschedule a workplace meeting.");
  await page.getByLabel("Why does the speaker need to move the meeting?").fill("Because of a scheduling conflict.");
  await page.getByLabel("What new time is suggested?").fill("Friday at 3.");
  await page.getByLabel("Type the phrase you heard").fill("Could we reschedule it?");
  await page.getByRole("button", { name: "Verify & save" }).click();

  await expect(page.getByText("Database unavailable.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unlocked Transcript" })).toHaveCount(0);
});

const lessonListItem = {
  id: 42,
  status: "accepted",
  topic: validLessonPack.topic,
  cefrLevel: validLessonPack.cefr_level,
  situation: validLessonPack.situation,
  createdAt: "2026-07-05T00:00:00.000Z"
};

function buildDetail(state: {
  listeningSaved: boolean;
  feedbackSaved: boolean;
  retryCompleted: boolean;
  roleplayResponse?: string | null;
  writingDraft?: string | null;
}) {
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
    roleplayTurns: [
      {
        id: 501,
        lessonPackId: 42,
        turnIndex: 1,
        aiPrompt: validLessonPack.roleplay.turns[0].ai_prompt,
        learnerGoal: validLessonPack.roleplay.turns[0].learner_goal,
        learnerResponse: state.roleplayResponse ?? null
      },
      {
        id: 502,
        lessonPackId: 42,
        turnIndex: 2,
        aiPrompt: validLessonPack.roleplay.turns[1].ai_prompt,
        learnerGoal: validLessonPack.roleplay.turns[1].learner_goal,
        learnerResponse: null
      }
    ],
    writingSubmission: {
      id: 701,
      lessonPackId: 42,
      task: validLessonPack.writing_task.task,
      constraints: validLessonPack.writing_task.constraints,
      targetChunks: validLessonPack.writing_task.target_chunks_to_use,
      draft: state.writingDraft ?? null
    },
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
