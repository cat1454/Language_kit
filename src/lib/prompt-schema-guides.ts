export const lessonPackSchemaGuide = [
  "Contract guide for lesson_pack.v1:",
  "Return one JSON object with these exact top-level keys: schema_version, topic, target_language, learner_native_language, cefr_level, situation, pre_listening, listening_input, while_listening, post_listening, roleplay, writing_task, rubric, retry_drills, quality_checks.",
  "Do not add extra top-level keys outside this strict shape.",
  'schema_version must be exactly "lesson_pack.v1".',
  "pre_listening: include context_brief, prediction_questions, and key_phrases_to_notice.",
  "listening_input: include script, recommended_voice, accent, speed, and duration_seconds. The script should be 60-90 seconds.",
  "while_listening is the comprehension_checks section: include gist_questions, detail_questions, and key_phrase_recognition. Question objects need question and answer; key phrase objects need phrase and meaning.",
  "post_listening: include chunks, shadowing_lines, and listening_to_speaking_bridge. chunks must contain 5-8 objects with phrase, meaning, and example.",
  "roleplay: include learner_role, ai_role, and turns. Each turn needs ai_prompt and learner_goal tied to the same situation.",
  "writing_task: include task, constraints, and target_chunks_to_use that continue the listening situation.",
  "rubric: include listening, speaking, and writing objectives as observable checklist strings.",
  "retry_drills: include at least one drill with instruction and items; source is optional.",
  "quality_checks: set level_is_cefr_appropriate, uses_target_chunks, and no_answer_leak_before_listening to true.",
  "Required pedagogical coverage: topic, rubric objectives, listening_input, chunks, comprehension_checks, roleplay, writing_task, retry_drills.",
  "The transcript may be stored in listening_input.script, but do not reveal it in pre_listening or while_listening answers before the learner completes listening checks."
].join("\n");

export const feedbackSchemaGuide = [
  "Contract guide for feedback.v1:",
  "Return one JSON object with top-level keys: scores, error_log_items, positive_notes, retry_drill.",
  "scores: include gist, detail, chunk_recognition, response_readiness, and output_transfer as numbers from 0 to 1.",
  "error_log_items: include at least one object with type, evidence, correction, why_it_matters, and retry_priority.",
  "type must be one of grammar, vocabulary, naturalness, pronunciation, listening, tone, or appropriateness.",
  "evidence should quote or closely match the learner attempt; correction should provide the improved language.",
  "why_it_matters is the explanation of the issue; retry_priority must be low, medium, or high.",
  "positive_notes: include concise strengths.",
  "retry_drill: include one instruction and one or more items that directly practice the logged issue."
].join("\n");
