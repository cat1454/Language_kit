# Data Contracts

## Contract Rules

All AI backends must return the same data shapes.

Rules:

- return raw valid JSON only
- no markdown fences
- no comments
- use `lesson_pack.v1` for lesson generation
- use observable rubric items
- include 5-8 useful chunks
- keep listening script around 60-90 seconds
- keep roleplay and writing tied to the listening situation
- do not reveal the full transcript in the learner UI before listening checks

The app can store the full transcript internally. The UI must control when it becomes visible.

Prompt/schema hardening adds compact contract guidance to the manual relay lesson and feedback prompts. This guidance is not a new schema version. The canonical contracts remain the Zod schemas in `src/lib/contracts.ts`, and AI output remains untrusted until it validates at the app boundary.

## Lesson Pack Contract

Schema version: `lesson_pack.v1`.

```json
{
  "schema_version": "lesson_pack.v1",
  "topic": "Reschedule a meeting",
  "target_language": "English",
  "learner_native_language": "Vietnamese",
  "cefr_level": "B1",
  "situation": "A workplace meeting must be moved because of a scheduling conflict.",
  "pre_listening": {
    "context_brief": "You need to ask a colleague to move a meeting politely.",
    "prediction_questions": [
      "Why might someone need to move a meeting?",
      "What polite phrases could they use?"
    ],
    "key_phrases_to_notice": [
      "scheduling conflict",
      "could we reschedule",
      "would Friday work for you"
    ]
  },
  "listening_input": {
    "script": "A: Hi Maya, do you have a minute? I wanted to ask about our meeting tomorrow. B: Sure, what is it about? A: I have a scheduling conflict in the afternoon. Could we reschedule it? B: I think so. What time works for you? A: Would Friday at 3 work for you? B: Friday at 3 is fine. Thanks for letting me know. A: Sorry for the inconvenience. B: No problem. Thanks for checking first.",
    "recommended_voice": "neutral workplace conversation",
    "accent": "General American or British",
    "speed": "B1 natural-slow",
    "duration_seconds": 75
  },
  "while_listening": {
    "gist_questions": [
      {
        "question": "What is the main purpose of the conversation?",
        "answer": "To reschedule a workplace meeting."
      }
    ],
    "detail_questions": [
      {
        "question": "Why does the speaker need to move the meeting?",
        "answer": "Because of a scheduling conflict."
      },
      {
        "question": "What new time is suggested?",
        "answer": "Friday at 3."
      }
    ],
    "key_phrase_recognition": [
      {
        "phrase": "Could we reschedule it?",
        "meaning": "A polite way to ask to move a meeting."
      }
    ]
  },
  "post_listening": {
    "chunks": [
      {
        "phrase": "Could we reschedule it?",
        "meaning": "A polite request to move an appointment.",
        "example": "Could we reschedule our call?"
      },
      {
        "phrase": "I have a scheduling conflict.",
        "meaning": "I already have another plan at that time.",
        "example": "I have a scheduling conflict on Thursday."
      },
      {
        "phrase": "Would Friday at 3 work for you?",
        "meaning": "A polite way to suggest a new time.",
        "example": "Would Monday morning work for you?"
      },
      {
        "phrase": "Sorry for the inconvenience.",
        "meaning": "A polite apology when a change causes trouble.",
        "example": "Sorry for the inconvenience, and thank you for your flexibility."
      },
      {
        "phrase": "Thanks for letting me know.",
        "meaning": "A polite response when someone gives an update.",
        "example": "Thanks for letting me know about the change."
      }
    ],
    "shadowing_lines": [
      "Could we reschedule it?",
      "Would Friday at 3 work for you?",
      "Sorry for the inconvenience."
    ],
    "listening_to_speaking_bridge": [
      "Use 'Could we reschedule...' to make a polite request.",
      "Use 'Would ... work for you?' to suggest a new time."
    ]
  },
  "roleplay": {
    "learner_role": "Employee who needs to move a meeting",
    "ai_role": "Colleague who responds politely",
    "turns": [
      {
        "ai_prompt": "Ask me why I want to move the meeting.",
        "learner_goal": "Explain the scheduling conflict politely."
      },
      {
        "ai_prompt": "Ask me to suggest another time.",
        "learner_goal": "Suggest Friday at 3 using a polite phrase."
      }
    ]
  },
  "writing_task": {
    "task": "Write a short email confirming the new meeting time.",
    "constraints": [
      "Use a polite tone.",
      "Mention the scheduling conflict.",
      "Confirm Friday at 3."
    ],
    "target_chunks_to_use": [
      "scheduling conflict",
      "would Friday at 3 work for you",
      "sorry for the inconvenience"
    ]
  },
  "rubric": {
    "listening": [
      "Identifies the main purpose.",
      "Catches the reason for rescheduling.",
      "Recognizes at least two target chunks."
    ],
    "speaking": [
      "Makes the request politely.",
      "Suggests a clear new time.",
      "Uses at least one target chunk."
    ],
    "writing": [
      "States the purpose clearly.",
      "Uses a polite workplace tone.",
      "Confirms the new time."
    ]
  },
  "retry_drills": [
    {
      "source": "Missed detail: new time",
      "instruction": "Listen again and identify the new proposed time.",
      "items": [
        "Friday at 3",
        "Thursday morning",
        "Monday at 10"
      ]
    }
  ],
  "quality_checks": {
    "level_is_cefr_appropriate": true,
    "uses_target_chunks": true,
    "no_answer_leak_before_listening": true
  }
}
```

## Feedback Contract

```json
{
  "scores": {
    "gist": 1,
    "detail": 1,
    "chunk_recognition": 1,
    "response_readiness": 1,
    "output_transfer": 1
  },
  "error_log_items": [
    {
      "type": "naturalness",
      "evidence": "I want change meeting to Friday.",
      "correction": "I would like to reschedule the meeting for Friday.",
      "why_it_matters": "The corrected sentence sounds more polite and natural in a workplace context.",
      "retry_priority": "high"
    }
  ],
  "positive_notes": [
    "The learner used the target phrase 'scheduling conflict' correctly."
  ],
  "retry_drill": {
    "instruction": "Rewrite the request using 'would like to' and 'reschedule'.",
    "items": [
      "I want change meeting to Friday.",
      "Can move meeting Friday?",
      "I busy tomorrow, meeting Friday?"
    ]
  }
}
```

## Validation Requirements

Manual relay prompts should reduce malformed output by naming the required keys and retry-drill/error-log fields, but validation must not depend on model obedience. Bad JSON, wrong shapes, and unsupported values are still rejected before persistence.

Minimum lesson-pack validation:

- `schema_version` equals `lesson_pack.v1`
- required top-level sections exist
- `topic`, `target_language`, `learner_native_language`, `cefr_level`, and `situation` are non-empty
- listening script exists internally
- duration is approximately 60-90 seconds
- 5-8 chunks are preferred
- roleplay and writing reuse the same situation
- quality checks are present

Minimum feedback validation:

- scores object exists
- error log items are structured
- retry drill exists
- each error item includes evidence, correction, reason, and retry priority

## Rejection Reasons

Store rejection reasons when AI output fails validation:

- invalid JSON
- wrong schema version
- missing required section
- markdown wrapper included
- transcript leak risk
- not CEFR appropriate
- too few chunks
- roleplay not tied to situation
- writing task unrelated
- feedback lacks retry drill

## Source Trace

- Canonical lesson pack, feedback contract, and validation rules: `research/budget-constrained-architecture.md`
- Listening flow and rubric criteria: `research/listening-first-language-practice.md`
