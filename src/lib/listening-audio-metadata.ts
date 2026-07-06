import { z } from "zod";

const audioVariantSchema = z.object({
  voiceId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  audioPath: z.string().trim().min(1)
});

const chunkTimingSchema = z.object({
  chunkIndex: z.number().int().nonnegative(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive()
}).refine((timing) => timing.endMs > timing.startMs, {
  path: ["endMs"],
  message: "endMs must be greater than startMs"
});

export const listeningAudioMetadataSchema = z.object({
  defaultVoiceId: z.string().trim().min(1).optional(),
  variants: z.array(audioVariantSchema).optional(),
  chunkTimings: z.array(chunkTimingSchema).optional(),
  durationMs: z.number().int().positive().optional()
}).strict();

export type ListeningAudioMetadata = z.infer<typeof listeningAudioMetadataSchema>;

export function normalizeListeningAudioMetadata(
  value: unknown
): ListeningAudioMetadata | null {
  if (value == null) return null;
  const parsed = listeningAudioMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
