import { describe, expect, it } from "vitest";
import { transcribeSpeakingAttempt } from "@/src/lib/speaking-transcription";

describe("speaking transcription boundary", () => {
  it("normalizes a completed manual transcript", () => {
    expect(transcribeSpeakingAttempt({
      provider: "manual",
      transcript: "  Could we reschedule for Friday?  "
    })).toEqual({
      transcript: "Could we reschedule for Friday?",
      provider: "manual",
      status: "completed"
    });
  });

  it("supports deterministic mock transcripts without a provider call", () => {
    expect(transcribeSpeakingAttempt({
      provider: "mock",
      transcript: "Mock transcript"
    })).toEqual({
      transcript: "Mock transcript",
      provider: "mock",
      status: "completed"
    });
  });

  it("marks an empty adapter result as failed", () => {
    expect(transcribeSpeakingAttempt({ provider: "manual", transcript: "   " })).toEqual({
      transcript: null,
      provider: "manual",
      status: "failed"
    });
  });
});
