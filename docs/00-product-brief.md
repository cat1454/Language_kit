# Product Brief

## Product Goal

Build a personal AI language practice system that helps a learner practice by topic through listening, speaking, writing, feedback, error logging, retry drills, and progress measurement.

The app is the source of truth. It owns:

- workflow
- lesson state
- logs
- validation
- rubrics
- retry drills
- progress measurement
- dataset export

AI tools produce structured outputs. The app validates and stores those outputs.

## Target Learner

The first target user is one serious self-learner practicing one target language at one level.

Default MVP assumptions:

- target language: English
- learner native language: Vietnamese
- CEFR level: B1
- first topic cluster: workplace and daily communication
- first sample topic: reschedule a meeting

These defaults are not hardcoded product limits. They are the initial test lane.

## Positioning

This is not a chat-first tutor. It is a data-backed practice system.

Each learning session should produce reusable data:

- listening input
- listening answers and missed details
- mined chunks
- roleplay turns
- writing submissions
- feedback
- repeated errors
- retry drills
- progress signals

The long-term product direction is a lightweight "AI Language Practice Kit" for serious learners, tutors, and teachers. The Web MVP is only the first practical step.

## Core Learning Loop

```text
topic
-> real situation
-> listening input
-> listening checks
-> chunk mining
-> roleplay
-> writing
-> rubric feedback
-> listening log + error log
-> retry drills
-> progress measurement
```

Listening comes before roleplay and writing because it gives the learner contextual input, phrases, rhythm, tone, and response patterns before they produce language.

## Non-Goals For The Web MVP

Do not build these first:

- mobile app
- realtime voice conversation
- AI avatar tutor
- gamification system
- social features
- marketplace
- teacher dashboard
- pronunciation scoring
- fine-tuned model
- multi-language platform
- paid API dependency for core use

## Success Definition

The MVP succeeds when one learner can complete a full topic cycle:

1. create a lesson pack prompt
2. paste AI JSON back into the app
3. complete listening checks
4. mine useful chunks
5. complete roleplay and writing attempts
6. paste feedback JSON
7. store errors and retry drills
8. see progress data
9. export the resulting dataset

## Source Trace

- Product system and non-goals: `research/listening-first-language-practice.md`
- Budget and AI execution boundary: `research/budget-constrained-architecture.md`
