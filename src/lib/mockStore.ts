"use client";

import type { ErrorType, FeedbackV1, LessonPackV1 } from "@/src/lib/contracts";
import type {
  LessonDetail as MockLessonDetail,
  LessonListItem as MockLessonListItem,
  ListeningAttempt as MockListeningAttempt,
  RetryDrill as MockRetryDrill
} from "@/src/lib/lesson-data";

type MockErrorLogItem = {
  id: number;
  lessonPackId: number;
  type: ErrorType;
  evidence: string;
  correction: string;
  whyItMatters: string;
  retryPriority: "low" | "medium" | "high";
  createdAt: string;
};

type StoredLessonDetail = MockLessonDetail & { errorLogItems: MockErrorLogItem[] };

// Pre-populated default lessons
const defaultLessonPack1: LessonPackV1 = {
  schema_version: "lesson_pack.v1",
  topic: "Meeting schedule adjustment",
  target_language: "English",
  learner_native_language: "Vietnamese",
  cefr_level: "B1",
  situation: "A workplace meeting must be moved because of an urgent scheduling conflict.",
  pre_listening: {
    context_brief: "You need to ask a colleague to move a meeting politely due to an urgent conflict.",
    prediction_questions: [
      "Why might someone need to reschedule a meeting at short notice?",
      "What polite request phrases can soften the inconvenience?"
    ],
    key_phrases_to_notice: [
      "scheduling conflict",
      "could we reschedule",
      "would Friday work for you"
    ]
  },
  listening_input: {
    script:
      "A: Hi Maya, do you have a minute? I wanted to ask about our meeting tomorrow. B: Sure, what is it about? A: I have a scheduling conflict in the afternoon. Could we reschedule it? B: I think so. What time works for you? A: Would Friday at 3 work for you? B: Friday at 3 is fine. Thanks for letting me know. A: Sorry for the inconvenience. B: No problem. Thanks for checking first.",
    recommended_voice: "neutral workplace conversation",
    accent: "General American or British",
    speed: "B1 natural-slow",
    duration_seconds: 75
  },
  while_listening: {
    gist_questions: [
      {
        question: "What is the main purpose of the conversation?",
        answer: "To reschedule a workplace meeting."
      }
    ],
    detail_questions: [
      {
        question: "Why does the speaker need to move the meeting?",
        answer: "Because of a scheduling conflict."
      },
      {
        question: "What new time is suggested?",
        answer: "Friday at 3."
      }
    ],
    key_phrase_recognition: [
      {
        phrase: "Could we reschedule it?",
        meaning: "A polite way to ask to move a meeting."
      }
    ]
  },
  post_listening: {
    chunks: [
      {
        phrase: "Could we reschedule it?",
        meaning: "A polite request to move an appointment.",
        example: "Could we reschedule our call?"
      },
      {
        phrase: "I have a scheduling conflict.",
        meaning: "I already have another plan at that time.",
        example: "I have a scheduling conflict on Thursday."
      },
      {
        phrase: "Would Friday at 3 work for you?",
        meaning: "A polite way to suggest a new time.",
        example: "Would Monday morning work for you?"
      },
      {
        phrase: "Sorry for the inconvenience.",
        meaning: "A polite apology when a change causes trouble.",
        example: "Sorry for the inconvenience, and thank you for your flexibility."
      },
      {
        phrase: "Thanks for letting me know.",
        meaning: "A polite response when someone gives an update.",
        example: "Thanks for letting me know about the change."
      }
    ],
    shadowing_lines: [
      "Could we reschedule it?",
      "Would Friday at 3 work for you?",
      "Sorry for the inconvenience."
    ],
    listening_to_speaking_bridge: [
      "Use 'Could we reschedule...' to make a polite request.",
      "Use 'Would ... work for you?' to suggest a new time."
    ]
  },
  roleplay: {
    learner_role: "Employee who needs to move a meeting",
    ai_role: "Colleague who responds politely",
    turns: [
      {
        ai_prompt: "Hey there! Sure, I have a minute. What did you want to discuss about tomorrow's schedule?",
        learner_goal: "Explain the scheduling conflict politely and ask to reschedule."
      },
      {
        ai_prompt: "Ah, I see. Rescheduling is fine. What other time were you thinking?",
        learner_goal: "Suggest Friday at 3 PM and apologize for the inconvenience."
      }
    ]
  },
  writing_task: {
    task: "Write a short email to Maya confirming the new meeting time.",
    constraints: [
      "Use a polite tone.",
      "Mention the scheduling conflict.",
      "Confirm Friday at 3 PM."
    ],
    target_chunks_to_use: [
      "scheduling conflict",
      "would Friday at 3 work for you",
      "sorry for the inconvenience"
    ]
  },
  rubric: {
    listening: [
      "Identifies the main purpose.",
      "Catches the reason for rescheduling.",
      "Recognizes at least two target chunks."
    ],
    speaking: [
      "Makes the request politely.",
      "Suggests a clear new time.",
      "Uses at least one target chunk."
    ],
    writing: [
      "States the purpose clearly.",
      "Uses a polite workplace tone.",
      "Confirms the new time."
    ]
  },
  retry_drills: [
    {
      source: "Missed detail: new time",
      instruction: "Rewrite: 'I busy tomorrow, meeting Friday?' into a polite request using 'would Friday at 3 work for you'.",
      items: ["I busy tomorrow, meeting Friday?"]
    }
  ],
  quality_checks: {
    level_is_cefr_appropriate: true,
    uses_target_chunks: true,
    no_answer_leak_before_listening: true
  }
};

const defaultLessonPack2: LessonPackV1 = {
  schema_version: "lesson_pack.v1",
  topic: "Order coffee in London",
  target_language: "English",
  learner_native_language: "Vietnamese",
  cefr_level: "A2",
  situation: "Ordering your favorite coffee at a busy cafe in London.",
  pre_listening: {
    context_brief: "A customer orders a flat white and asks for the Wi-Fi password in a café.",
    prediction_questions: [
      "How do customers ask for prices in London?",
      "What are the typical coffee sizes available?"
    ],
    key_phrases_to_notice: [
      "I'd like to order",
      "to go or have in",
      "can I get the password"
    ]
  },
  listening_input: {
    script:
      "A: Hello, what can I get for you today? B: Hi, I'd like a medium flat white, please. A: Sure. Is that to go or have in? B: To go, please. Also, can I get the Wi-Fi password? A: Yes, it's on the receipt. That's four pounds fifty, please. B: Here you go. Thank you. A: Cheers!",
    recommended_voice: "British accent barista",
    accent: "London British",
    speed: "A2 slow-clear",
    duration_seconds: 60
  },
  while_listening: {
    gist_questions: [
      {
        question: "Where does this conversation take place?",
        answer: "In a coffee shop / cafe in London."
      }
    ],
    detail_questions: [
      {
        question: "What drink did the customer order?",
        answer: "A medium flat white."
      },
      {
        question: "How much did it cost?",
        answer: "Four pounds fifty."
      }
    ],
    key_phrase_recognition: [
      {
        phrase: "To go, please.",
        meaning: "Used when you want to take your food/drink away."
      }
    ]
  },
  post_listening: {
    chunks: [
      {
        phrase: "I'd like a flat white, please.",
        meaning: "Polite request to order a specific coffee.",
        example: "I'd like an iced latte, please."
      },
      {
        phrase: "To go or have in?",
        meaning: "Asking if the order is for takeaway or dine-in.",
        example: "Will that be to go or have in today?"
      },
      {
        phrase: "Can I get the Wi-Fi password?",
        meaning: "Asking to use the establishment's internet.",
        example: "Excuse me, can I get the Wi-Fi password?"
      },
      {
        phrase: "Here you go.",
        meaning: "Pharse used when handing over cash or card.",
        example: "Here you go, keep the change."
      },
      {
        phrase: "Thanks for checking.",
        meaning: "Polite acknowledgement.",
        example: "Thanks for checking the prices."
      }
    ],
    shadowing_lines: [
      "I'd like a flat white, please.",
      "To go, please.",
      "Can I get the Wi-Fi password?"
    ],
    listening_to_speaking_bridge: [
      "Use 'I'd like ...' to specify your order.",
      "Use 'To go, please' for takeaway."
    ]
  },
  roleplay: {
    learner_role: "Customer ordering coffee",
    ai_role: "London Barista",
    turns: [
      {
        ai_prompt: "Hi there! Welcome to Monmouth Coffee. What can I get started for you?",
        learner_goal: "Order a flat white politely."
      },
      {
        ai_prompt: "Lovely choice. Is that to go, or having in today?",
        learner_goal: "Answer 'To go' and ask for the Wi-Fi password."
      }
    ]
  },
  writing_task: {
    task: "Write a short message to a friend suggesting a meet-up at this cafe.",
    constraints: [
      "Mention ordering a flat white.",
      "Ask if they want to join.",
      "Mention they have free Wi-Fi."
    ],
    target_chunks_to_use: [
      "I'd like a flat white, please",
      "can I get the Wi-Fi password"
    ]
  },
  rubric: {
    listening: [
      "Identifies coffee type.",
      "Understands to go / have in choice."
    ],
    speaking: [
      "Orders correctly.",
      "Asks for internet access."
    ],
    writing: [
      "Coordinates location.",
      "Mentions coffee choice."
    ]
  },
  retry_drills: [
    {
      source: "Grammar mistake",
      instruction: "Correct 'I want flat white coffee' to 'I'd like a flat white, please'.",
      items: ["I want flat white coffee"]
    }
  ],
  quality_checks: {
    level_is_cefr_appropriate: true,
    uses_target_chunks: true,
    no_answer_leak_before_listening: true
  }
};

const defaultLessons: StoredLessonDetail[] = [
  {
    lessonPack: {
      id: 101,
      status: "accepted",
      prompt: "Generate a lesson about rescheduling a meeting for level B1.",
      rawAiOutput: JSON.stringify(defaultLessonPack1, null, 2),
      validatedJson: defaultLessonPack1,
      createdAt: "2026-07-01T10:00:00Z"
    },
    lesson: defaultLessonPack1,
    listeningAttempts: [],
    errorLogItems: [
      {
        id: 501,
        lessonPackId: 101,
        type: "naturalness",
        evidence: "I busy tomorrow, meeting Friday?",
        correction: "I'm busy tomorrow, could we reschedule for Friday?",
        whyItMatters: "Using polite phrasing sounds more professional in business communication.",
        retryPriority: "high",
        createdAt: "2026-07-01T10:15:00Z"
      }
    ],
    retryDrills: [
      {
        id: 601,
        lessonPackId: 101,
        instruction: "Polite rescheduling request",
        items: ["I busy tomorrow, meeting Friday?", "Change tomorrow to Friday"],
      }
    ]
  },
  {
    lessonPack: {
      id: 102,
      status: "accepted",
      prompt: "Generate a lesson about ordering coffee in London for level A2.",
      rawAiOutput: JSON.stringify(defaultLessonPack2, null, 2),
      validatedJson: defaultLessonPack2,
      createdAt: "2026-07-02T12:00:00Z"
    },
    lesson: defaultLessonPack2,
    listeningAttempts: [
      {
        id: 401,
        lessonPackId: 102,
        gistAnswers: ["It is at a cafe in London."],
        detailAnswers: ["A flat white", "4.50 pounds"],
        keyPhraseAnswers: ["To go, please."],
        replayCount: 1,
        scoreGist: 1.0,
        scoreDetail: 1.0,
        scoreKeyPhrase: 1.0,
        missedDetails: [],
        createdAt: "2026-07-02T12:10:00Z"
      }
    ],
    errorLogItems: [],
    retryDrills: []
  }
];

const LOCAL_STORAGE_KEY = "language_kit_mock_db";

function isClient() {
  return typeof window !== "undefined";
}

function getStoredData(): StoredLessonDetail[] {
  if (!isClient()) return defaultLessons;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultLessons));
    return defaultLessons;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return defaultLessons;
  }
}

function setStoredData(data: StoredLessonDetail[]) {
  if (!isClient()) return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function mockGetLessons(): MockLessonListItem[] {
  const data = getStoredData();
  return data.map((d) => ({
    id: d.lessonPack.id,
    status: d.lessonPack.status,
    topic: d.lesson.topic,
    cefrLevel: d.lesson.cefr_level,
    situation: d.lesson.situation,
    createdAt: d.lessonPack.createdAt
  }));
}

export function mockGetLessonDetail(id: number): StoredLessonDetail | null {
  const data = getStoredData();
  return data.find((d) => d.lessonPack.id === id) || null;
}

export function mockSaveLesson(
  prompt: string,
  rawAiOutput: string,
  validatedJson: LessonPackV1
): MockLessonListItem {
  const data = getStoredData();
  const nextId = data.length > 0 ? Math.max(...data.map((d) => d.lessonPack.id)) + 1 : 101;

  // Create mapping for drills
  const mockDrills: MockRetryDrill[] = validatedJson.retry_drills.map((drill, index) => ({
    id: 1000 + nextId * 10 + index,
    lessonPackId: nextId,
    instruction: drill.instruction,
    items: drill.items
  }));

  const newDetail: StoredLessonDetail = {
    lessonPack: {
      id: nextId,
      status: "accepted",
      prompt,
      rawAiOutput,
      validatedJson,
      createdAt: new Date().toISOString()
    },
    lesson: validatedJson,
    listeningAttempts: [],
    errorLogItems: [],
    retryDrills: mockDrills
  };

  data.unshift(newDetail);
  setStoredData(data);

  return {
    id: nextId,
    status: "accepted",
    topic: validatedJson.topic,
    cefrLevel: validatedJson.cefr_level,
    situation: validatedJson.situation,
    createdAt: newDetail.lessonPack.createdAt
  };
}

export function mockSaveListeningAttempt(
  lessonPackId: number,
  attempt: Omit<MockListeningAttempt, "id" | "createdAt" | "lessonPackId">
): MockListeningAttempt {
  const data = getStoredData();
  const index = data.findIndex((d) => d.lessonPack.id === lessonPackId);
  if (index === -1) {
    throw new Error("Lesson not found");
  }

  const nextAttemptId = Math.floor(Math.random() * 1000000);
  const newAttempt: MockListeningAttempt = {
    ...attempt,
    id: nextAttemptId,
    lessonPackId,
    createdAt: new Date().toISOString()
  };

  data[index].listeningAttempts.push(newAttempt);
  setStoredData(data);
  return newAttempt;
}

export function mockSaveWritingFeedback(
  lessonPackId: number,
  feedback: FeedbackV1
): { errorCount: number; drillCount: number } {
  const data = getStoredData();
  const index = data.findIndex((d) => d.lessonPack.id === lessonPackId);
  if (index === -1) {
    throw new Error("Lesson not found");
  }

  const errorItems: MockErrorLogItem[] = feedback.error_log_items.map((item, idx) => ({
    id: Math.floor(Math.random() * 1000000) + idx,
    lessonPackId,
    type: item.type,
    evidence: item.evidence,
    correction: item.correction,
    whyItMatters: item.why_it_matters,
    retryPriority: item.retry_priority,
    createdAt: new Date().toISOString()
  }));

  const drillItem: MockRetryDrill = {
    id: Math.floor(Math.random() * 1000000) + 99,
    lessonPackId,
    instruction: feedback.retry_drill.instruction,
    items: feedback.retry_drill.items
  };

  data[index].errorLogItems.push(...errorItems);
  data[index].retryDrills.push(drillItem);
  setStoredData(data);

  return {
    errorCount: errorItems.length,
    drillCount: 1
  };
}

export function mockCompleteRetryDrill(
  lessonPackId: number,
  drillId: number,
  learnerResult: string
): MockRetryDrill | null {
  const data = getStoredData();
  const lessonIdx = data.findIndex((d) => d.lessonPack.id === lessonPackId);
  if (lessonIdx === -1) return null;

  const drillIdx = data[lessonIdx].retryDrills.findIndex((dr) => dr.id === drillId);
  if (drillIdx === -1) return null;

  data[lessonIdx].retryDrills[drillIdx].learnerResult = learnerResult;
  data[lessonIdx].retryDrills[drillIdx].completedAt = new Date().toISOString();

  setStoredData(data);
  return data[lessonIdx].retryDrills[drillIdx];
}

export function mockGetDashboardSummary() {
  const data = getStoredData();

  let completedTopics = 0;
  let completedRetryDrills = 0;
  const repeatedErrorTypes: Record<string, number> = {};

  data.forEach((d) => {
    if (d.lessonPack.status === "accepted") {
      completedTopics++;
    }

    d.retryDrills.forEach((drill) => {
      if (drill.completedAt) {
        completedRetryDrills++;
      }
    });

    d.errorLogItems.forEach((err) => {
      repeatedErrorTypes[err.type] = (repeatedErrorTypes[err.type] || 0) + 1;
    });
  });

  return {
    completedTopics,
    completedRetryDrills,
    repeatedErrorTypes
  };
}
