# MVP Scope

## MVP Name

Personal AI Language Practice System v0: Listening + Speaking + Writing.

## In Scope

### Topic And Lesson Prompt Builder

The learner can enter:

- target language
- native language
- CEFR level
- topic
- situation
- session length
- target skill focus

The app generates a strict prompt for lesson-pack JSON.

### Manual AI Relay

The learner can:

- copy the prompt
- paste it into a free AI website manually
- copy the AI response
- paste the response into the app

The app must not automate free AI websites unless their terms explicitly allow automation.

### JSON Validation And Repair Support

The app validates pasted lesson-pack JSON against `lesson_pack.v1`.

If invalid, the app should:

- show validation errors
- generate a repair prompt
- let the learner paste the repaired JSON
- store accepted and rejected outputs with reasons

### Lesson Display

The app displays:

- situation
- pre-listening brief
- listening tasks
- chunk mining items
- roleplay prompt
- writing task
- rubric
- retry drills

The full listening transcript must not be revealed before the learner completes listening checks.

### Listening Practice

The learner can:

- listen to or read the listening input depending on MVP capability
- answer gist questions
- answer detail questions
- identify key phrases
- record replay count
- log missed details

Initial audio may be generated outside the app or added later through local TTS.

### Roleplay And Writing Attempts

The learner can:

- complete text roleplay turns
- write a response for the same situation
- reuse mined chunks
- store attempts

Voice roleplay is not required for MVP.

### Feedback And Error Log

The learner can:

- generate a feedback prompt from the lesson context and their attempt
- paste feedback JSON back into the app
- store scores
- store error log items
- store one retry drill

### Progress Dashboard

The MVP dashboard shows simple progress:

- completed topics
- listening score trends
- repeated error types
- chunk reuse
- retry drill completion

### Dataset Export

The app can export JSONL datasets for future training:

- `lesson_generation_sft.jsonl`
- `feedback_scoring_sft.jsonl`
- `error_classification.jsonl`
- `retry_generation_sft.jsonl`
- `json_repair_sft.jsonl`

## Out Of Scope

- authentication
- subscriptions or payments
- teacher mode
- class management
- marketplace
- realtime voice
- automatic free-website scraping
- fine-tuning
- ASR adaptation
- pronunciation scoring
- mobile app
- multi-user collaboration

## Completion Criteria

The Web MVP is complete enough for first coding milestone when:

1. A prompt can be generated from learner input.
2. A pasted lesson pack can be validated.
3. Invalid JSON can be routed through a repair prompt.
4. Accepted lesson packs can be stored and displayed.
5. Listening checks, roleplay, writing, feedback, errors, and retry drills can be stored.
6. Progress can be shown at a basic level.
7. Data can be exported as JSONL.

## Source Trace

- MVP-first constraints and anti-bloat guidance: `research/listening-first-language-practice.md`
- Manual relay, validation, storage, and export requirements: `research/budget-constrained-architecture.md`
