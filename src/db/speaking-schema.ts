import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp
} from "drizzle-orm/pg-core";
import { lessonPacks } from "@/src/db/core-schema";
import type {
  SpeakingSttProvider,
  SpeakingSttStatus
} from "@/src/lib/speaking-transcription";

export const speakingAttempts = pgTable(
  "speaking_attempts",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer("user_id").default(1).notNull(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    promptType: text("prompt_type").notNull(),
    promptRef: text("prompt_ref"),
    audioPath: text("audio_path"),
    transcript: text("transcript"),
    sttProvider: text("stt_provider").$type<SpeakingSttProvider>(),
    sttStatus: text("stt_status")
      .$type<SpeakingSttStatus>()
      .default("not_requested")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
  },
  (table) => [
    index("speaking_attempts_lesson_pack_id_idx").on(table.lessonPackId),
    index("speaking_attempts_created_at_idx").on(table.createdAt)
  ]
);
