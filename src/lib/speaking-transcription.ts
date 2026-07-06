export type SpeakingSttProvider = "manual" | "mock" | "future_local";
export type SpeakingSttStatus = "not_requested" | "completed" | "failed";

type AvailableSpeakingProvider = Exclude<SpeakingSttProvider, "future_local">;

export function transcribeSpeakingAttempt(input: {
  provider: AvailableSpeakingProvider;
  transcript: string;
}): {
  transcript: string | null;
  provider: SpeakingSttProvider;
  status: SpeakingSttStatus;
} {
  const transcript = input.transcript.trim();
  return {
    transcript: transcript || null,
    provider: input.provider,
    status: transcript ? "completed" : "failed"
  };
}
