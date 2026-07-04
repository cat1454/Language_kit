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
  const populated = [gist, detail, keyPhrase].filter((score) => score > 0);

  return {
    gist,
    detail,
    keyPhrase,
    overall:
      populated.length === 0
        ? 0
        : round2(populated.reduce((sum, score) => sum + score, 0) / populated.length)
  };
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
