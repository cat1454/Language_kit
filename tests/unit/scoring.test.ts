import { describe, expect, it } from "vitest";
import {
  calculateListeningScore,
  calculateWritingReadinessScore,
  matchesAnswerKeywords,
  matchesKeyPhrase
} from "@/src/lib/scoring";

describe("listening scoring", () => {
  it("calculates a normalized score from gist, detail, and key phrase scores", () => {
    const score = calculateListeningScore({
      gistCorrect: 1,
      gistTotal: 1,
      detailCorrect: 1,
      detailTotal: 2,
      keyPhraseCorrect: 2,
      keyPhraseTotal: 4
    });

    expect(score).toEqual({
      gist: 1,
      detail: 0.5,
      keyPhrase: 0.5,
      overall: 0.67
    });
  });

  it("returns zero for empty sections instead of dividing by zero", () => {
    const score = calculateListeningScore({
      gistCorrect: 0,
      gistTotal: 0,
      detailCorrect: 0,
      detailTotal: 0,
      keyPhraseCorrect: 0,
      keyPhraseTotal: 0
    });

    expect(score.overall).toBe(0);
  });

  it("keeps populated zero-score sections in the overall average", () => {
    const score = calculateListeningScore({
      gistCorrect: 1,
      gistTotal: 1,
      detailCorrect: 0,
      detailTotal: 2,
      keyPhraseCorrect: 0,
      keyPhraseTotal: 1
    });

    expect(score.overall).toBe(0.33);
  });

  it("matches free-text answers by normalized expected keyword coverage", () => {
    expect(
      matchesAnswerKeywords(
        "Because of a scheduling conflict at work.",
        "Because of a scheduling conflict."
      )
    ).toBe(true);
    expect(matchesAnswerKeywords("Friday", "Because of a scheduling conflict.")).toBe(false);
  });

  it("matches key phrases without case or punctuation sensitivity", () => {
    expect(matchesKeyPhrase("Could we reschedule it", "Could we reschedule it?")).toBe(true);
    expect(matchesKeyPhrase("Please move it", "Could we reschedule it?")).toBe(false);
  });
});

describe("writing readiness scoring", () => {
  it("averages chunk and constraint ratios without exceeding 100", () => {
    expect(
      calculateWritingReadinessScore({
        usedChunks: 3,
        totalChunks: 3,
        matchedConstraints: 3,
        totalConstraints: 3
      })
    ).toBe(100);
  });

  it("returns zero when both sections are empty", () => {
    expect(
      calculateWritingReadinessScore({
        usedChunks: 0,
        totalChunks: 0,
        matchedConstraints: 0,
        totalConstraints: 0
      })
    ).toBe(0);
  });
});
