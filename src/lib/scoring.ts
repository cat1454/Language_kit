export type ListeningScoreInput = {
  gistCorrect: number;
  gistTotal: number;
  detailCorrect: number;
  detailTotal: number;
  keyPhraseCorrect: number;
  keyPhraseTotal: number;
};

export type ListeningScore = {
  gist: number;
  detail: number;
  keyPhrase: number;
  overall: number;
};

export function calculateListeningScore(input: ListeningScoreInput): ListeningScore {
  const gist = ratio(input.gistCorrect, input.gistTotal);
  const detail = ratio(input.detailCorrect, input.detailTotal);
  const keyPhrase = ratio(input.keyPhraseCorrect, input.keyPhraseTotal);
  const populated = [
    { score: gist, total: input.gistTotal },
    { score: detail, total: input.detailTotal },
    { score: keyPhrase, total: input.keyPhraseTotal }
  ].filter((section) => section.total > 0);

  return {
    gist,
    detail,
    keyPhrase,
    overall:
      populated.length === 0
        ? 0
        : round2(
            populated.reduce((sum, section) => sum + section.score, 0) /
              populated.length
          )
  };
}

export function matchesAnswerKeywords(answer: string, expected: string): boolean {
  const normalizedAnswer = normalizeText(answer);
  const keywords = [...new Set(normalizeText(expected).split(" "))].filter(
    (token) => token.length >= 3
  );

  if (!normalizedAnswer || keywords.length === 0) {
    return normalizedAnswer === normalizeText(expected);
  }

  const answerTokens = new Set(normalizedAnswer.split(" "));
  const matched = keywords.filter((keyword) => answerTokens.has(keyword)).length;
  return matched / keywords.length >= 0.6;
}

export function matchesKeyPhrase(answer: string, expected: string): boolean {
  return normalizeText(answer) === normalizeText(expected);
}

export function calculateWritingReadinessScore(input: {
  usedChunks: number;
  totalChunks: number;
  matchedConstraints: number;
  totalConstraints: number;
}): number {
  if (input.totalChunks <= 0 && input.totalConstraints <= 0) return 0;

  const chunkRatio = ratio(input.usedChunks, input.totalChunks);
  const constraintRatio = ratio(input.matchedConstraints, input.totalConstraints);
  return Math.round(Math.max(0, Math.min((chunkRatio + constraintRatio) / 2, 1)) * 100);
}

function ratio(correct: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return round2(Math.max(0, Math.min(correct / total, 1)));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
