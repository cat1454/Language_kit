# Data Model

## Database Choice

Keep the database choice open for the first implementation:

- SQLite is preferred for a local-first MVP.
- Supabase/Postgres is acceptable if hosted sync or remote testing is needed.

The logical model should stay the same.

## Core Tables

User-owned tables may include `user_id INTEGER NOT NULL DEFAULT 1` as a
single-user placeholder. This is not authentication, authorization, or a real
multi-user model.

### topics

Stores the learning situation selected by the learner.

Fields:

- `id`
- `topic`
- `target_language`
- `learner_native_language`
- `cefr_level`
- `situation`
- `session_minutes`
- `created_at`
- `completed_at`

### lesson_packs

Stores generated lesson packs and validation state.

Fields:

- `id`
- `topic_id`
- `schema_version`
- `prompt`
- `raw_ai_output`
- `validated_json`
- `source_mode`
- `provider_or_site`
- `model_name`
- `status`
- `rejection_reason`
- `created_at`
- `accepted_at`

Allowed `source_mode` values:

- `manual_free_relay`
- `local_model`
- `paid_api`

Allowed `status` values:

- `accepted`
- `rejected`
- `needs_repair`

### listening_inputs

Stores listening material for a lesson.

Fields:

- `id`
- `lesson_pack_id`
- `script`
- `audio_path`
- `audio_metadata_json`
- `recommended_voice`
- `accent`
- `speed`
- `duration_seconds`
- `transcript_visible_after_attempt`

### listening_attempts

Stores learner listening performance.

Fields:

- `id`
- `lesson_pack_id`
- `listening_input_id`
- `gist_answers`
- `detail_answers`
- `key_phrase_answers`
- `replay_count`
- `score_gist`
- `score_detail`
- `score_key_phrase`
- `missed_details`
- `created_at`

### chunks

Stores reusable language chunks from listening input.

Fields:

- `id`
- `lesson_pack_id`
- `phrase`
- `meaning`
- `example`
- `source_context`
- `times_recognized`
- `times_reused_correctly`
- `created_at`

### roleplay_turns

Stores text roleplay practice.

Fields:

- `id`
- `lesson_pack_id`
- `turn_index`
- `ai_prompt`
- `learner_goal`
- `learner_response`
- `feedback_json`
- `created_at`

### speaking_attempts

Stores optional speaking practice metadata and manual transcripts. Prompt 9
does not persist audio; `audio_path` is reserved for a later explicitly
approved storage workflow.

Fields:

- `id`
- `lesson_pack_id`
- `user_id INTEGER NOT NULL DEFAULT 1`
- `prompt_type`
- `prompt_ref`
- `audio_path`
- `transcript`
- `stt_provider`
- `stt_status`
- `created_at`
- `updated_at`

### writing_submissions

Stores writing practice.

Fields:

- `id`
- `lesson_pack_id`
- `task`
- `constraints_json`
- `target_chunks_json`
- `draft`
- `corrected_version`
- `rubric_scores_json`
- `feedback_json`
- `created_at`

### error_log

Stores errors worth retrying.

Fields:

- `id`
- `lesson_pack_id`
- `source_type`
- `error_type`
- `evidence`
- `correction`
- `why_it_matters`
- `retry_priority`
- `resolved_at`
- `created_at`

Allowed `source_type` values:

- `listening`
- `roleplay`
- `writing`
- `feedback`

Allowed `error_type` values:

- `grammar`
- `vocabulary`
- `naturalness`
- `pronunciation`
- `listening`
- `tone`
- `appropriateness`

### retry_drills

Stores retry actions generated from feedback and errors.

Fields:

- `id`
- `lesson_pack_id`
- `error_log_id`
- `instruction`
- `items_json`
- `learner_result`
- `completed_at`
- `created_at`

### model_outputs

Stores all AI outputs, accepted or rejected.

Fields:

- `id`
- `task_type`
- `source_mode`
- `provider_or_site`
- `model_name`
- `prompt`
- `raw_response`
- `parsed_json`
- `accepted`
- `rejection_reason`
- `created_at`

Allowed `task_type` values:

- `lesson_generation`
- `json_repair`
- `feedback_scoring`
- `retry_generation`

## Export Datasets

The MVP should be able to export:

- `lesson_generation_sft.jsonl`
- `feedback_scoring_sft.jsonl`
- `error_classification.jsonl`
- `retry_generation_sft.jsonl`
- `json_repair_sft.jsonl`

Each export should preserve enough context to be useful later:

- prompt
- raw response
- accepted normalized JSON
- source mode
- rejection reason if rejected
- lesson context

## Derived Adaptive Review Read Model

Adaptive review v1 adds no table and no migration. `GET /api/review-queue`
derives learner-safe review items from existing `retry_drills`, `error_log`,
`listening_attempts`, `writing_submissions`, `roleplay_turns`, and
`speaking_attempts`.

The read layer joins through `lesson_packs` and `topics`, filters the current
single-user placeholder internally, and projects only compact review fields.
It never returns `user_id`, speaking or listening audio paths, raw model output,
or full transcript/body payloads.

`model_outputs` is not used directly because it lacks a lesson-pack foreign key.
Accepted feedback signals are already available through feedback-created errors,
retry drills, and writing feedback.

## Source Trace

- Storage tables and dataset exports: `research/budget-constrained-architecture.md`
- Listening log, error log, chunks, and retry data needs: `research/listening-first-language-practice.md`
