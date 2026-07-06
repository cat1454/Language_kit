# AI Execution Modes

## Cost Policy

Use this order:

```text
free relay first
-> local model second
-> paid API fallback last
```

The core MVP must not require paid APIs.

## Mode A: Manual Free-AI Relay

Manual relay is the default MVP mode.

Flow:

1. Learner chooses topic, situation, CEFR level, target language, native language, and session length.
2. App generates a strict prompt with compact contract guidance.
3. Learner copies the prompt into a free AI website.
4. AI returns JSON.
5. Learner pastes JSON into the app.
6. App validates, stores, or rejects the result.
7. If rejected, app generates a repair prompt.

Supported sites can include any free AI website the learner manually uses. The app should not automate these sites unless their terms explicitly allow automation.

Current manual relay prompts ask for raw JSON only, no markdown fences, no comments, and no prose before or after the JSON. The prompt guidance is a generation aid; Zod validation remains the acceptance gate before persistence.

## Mode B: Local Open Model

Local model mode comes after the manual relay MVP works.

Possible runtimes:

- Ollama
- LM Studio
- llama.cpp
- vLLM

Initial local model targets:

- Qwen 4B-8B class models for JSON lesson generation and multilingual support
- Mistral or Ministral 3B-8B for compact generation
- Gemma 4B-9B if licensing and local quality fit
- larger open models only if hardware permits

Local mode must use the same JSON contracts as manual relay mode.

## Mode C: Paid API Fallback

Paid API mode is optional and feature-flagged.

Use it only for:

- hard lessons that free or local models fail
- premium workflows
- teacher mode
- gold-standard evaluation examples
- final quality review

Paid APIs must not change the lesson schema.

## Lesson Generation Prompt Template

```text
You are generating a structured lesson pack for a personal AI language practice system.

Return raw JSON only. Do not include markdown fences, comments, or prose before or after JSON.

Task:
- Target language: {{target_language}}
- Learner native language: {{native_language}}
- CEFR level: {{cefr_level}}
- Topic: {{topic}}
- Situation: {{situation}}
- Session length: {{session_minutes}} minutes

Pedagogy:
- Use task-based, context-based learning.
- Listening must come before roleplay.
- Follow pre-listening, while-listening, post-listening.
- The listening input should be short, realistic, and reusable for speaking and writing.
- Do not reveal the full transcript before the listening checks.
- Include gist questions, detail questions, key phrase recognition, chunk mining, roleplay, writing, rubric, and retry drills.

Output schema:
{{lesson_pack_schema}}

Compact contract guide:
- Use `schema_version` exactly `lesson_pack.v1`.
- Return one JSON object with the exact top-level keys from `lesson_pack.v1`.
- Do not add extra top-level keys.
- Include pre-listening, listening input, listening checks, chunk mining, roleplay, writing, rubric, retry drills, and quality checks.
- Keep objectives inside the existing rubric fields.

Quality rules:
- Use natural language appropriate for {{cefr_level}}.
- Include 5-8 useful chunks.
- Make the listening script 60-90 seconds.
- Make the roleplay directly reuse the listening situation.
- Make the writing task continue the same situation.
- Keep feedback rubrics observable and easy to log.
- Silently check that the final answer parses as JSON and follows `lesson_pack.v1`.
```

## JSON Repair Prompt Template

```text
Repair the following response into valid JSON matching the schema.

Rules:
- Return ONLY valid JSON.
- Preserve the useful content.
- Remove markdown fences and comments.
- Fill missing required fields with reasonable defaults.
- Do not invent a different lesson.

Schema:
{{lesson_pack_schema}}

Broken response:
{{broken_response}}
```

## Feedback Prompt Template

```text
You are evaluating a language learner's response.

Return raw JSON only. Do not include markdown fences, comments, or prose before or after JSON.

Context:
- Target language: {{target_language}}
- Native language: {{native_language}}
- CEFR level: {{cefr_level}}
- Topic: {{topic}}
- Listening script summary: {{listening_summary}}
- Target chunks: {{target_chunks}}

Learner attempt:
{{learner_attempt}}

Evaluate:
1. Listening comprehension if answers are included.
2. Speaking or writing quality.
3. Chunk reuse.
4. Errors worth logging.
5. One retry drill.

Output:
{{feedback_schema}}

Compact contract guide:
- Return one JSON object with `scores`, `error_log_items`, `positive_notes`, and `retry_drill`.
- Include `gist`, `detail`, `chunk_recognition`, `response_readiness`, and `output_transfer` scores from 0 to 1.
- Each error item must include `type`, `evidence`, `correction`, `why_it_matters`, and `retry_priority`.
- `retry_drill` must include one instruction and one or more items tied to the logged issue.
```

## Source Trace

- AI execution modes, prompt templates, and cost policy: `research/budget-constrained-architecture.md`
- Listening-first pedagogy constraint: `research/listening-first-language-practice.md`
