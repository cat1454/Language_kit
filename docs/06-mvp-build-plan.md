# MVP Build Plan

## Build Principle

Build the smallest web system that proves the learning loop and data loop.

Do not build voice, fine-tuning, auth, payments, or teacher workflows before the manual relay MVP works.

## Milestone 1: Prompt Builder And Schema Validation

Goal:

- Generate a strict lesson-pack prompt from learner input.
- Validate pasted lesson-pack JSON.

Deliverables:

- topic input form
- prompt preview
- copy prompt action
- paste AI JSON input
- `lesson_pack.v1` validation
- validation error display
- repair prompt generation

Done when:

- the learner can generate a prompt for "English B1 - reschedule a meeting"
- valid JSON is accepted
- invalid JSON is rejected with a useful reason

## Milestone 2: Lesson Display And Storage

Goal:

- Store accepted lesson packs.
- Display a lesson in the intended learning order.

Deliverables:

- accepted lesson storage
- lesson detail page or panel
- transcript hidden until after listening attempt
- visible pre-listening and while-listening tasks
- chunk, roleplay, writing, rubric, and retry sections

Done when:

- accepted lesson packs persist after refresh
- the learner can reopen a stored lesson

## Milestone 3: Listening Checks And Logs

Goal:

- Capture listening practice results.

Deliverables:

- gist answer form
- detail answer form
- key phrase recognition form
- replay count field
- missed detail log
- basic listening score

Done when:

- a listening attempt can be saved
- missed details are visible in the listening log

## Milestone 4: Roleplay, Writing, And Feedback Paste

Goal:

- Capture learner output and pasted feedback JSON.

Deliverables:

- text roleplay response fields
- writing submission field
- feedback prompt generation
- feedback JSON paste input
- feedback validation
- error log creation

Done when:

- learner output and feedback are stored
- error log items include evidence, correction, reason, and priority

## Milestone 5: Retry Drills And Dashboard

Goal:

- Turn feedback into practice and show simple progress.

Deliverables:

- retry drill view
- retry completion field
- completed topics count
- repeated error summary
- listening score trend
- chunk reuse count

Done when:

- a retry drill can be completed and linked to an error
- dashboard shows useful progress from at least one completed topic

## Milestone 6: Dataset Export

Goal:

- Export useful data for future fine-tuning or analysis.

Deliverables:

- lesson generation export
- feedback scoring export
- error classification export
- retry generation export
- JSON repair export

Done when:

- each export produces JSONL
- exported rows include enough context to train or evaluate later

## Later Milestones

After the Web MVP works:

- add local TTS
- add local model mode
- add Whisper or similar ASR
- add paid API fallback
- test with 3-5 external learners
- add teacher mode

## Source Trace

- Week-by-week MVP build path and later phases: `research/budget-constrained-architecture.md`
- Long-term roadmap and anti-bloat principles: `research/listening-first-language-practice.md`
