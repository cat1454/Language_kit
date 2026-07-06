import type { FeedbackV1 } from "@/src/lib/contracts";

export function buildWritingFeedbackPatch(feedback: FeedbackV1) {
  return {
    feedbackJson: feedback,
    rubricScoresJson: feedback.scores
  };
}
