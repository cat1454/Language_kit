import { describe, expect, it } from "vitest";
import { calculateListeningScore } from "@/src/lib/scoring";

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
});
