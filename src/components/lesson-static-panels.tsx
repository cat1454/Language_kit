"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  MessageSquare,
  PenTool,
  Send,
  Volume2
} from "lucide-react";
import { DataSourceNotice } from "@/src/components/data-source-notice";
import type { LessonPackV1 } from "@/src/lib/contracts";
import type { DataSource, ListeningAttempt } from "@/src/lib/lesson-data";

export type LessonTab = "warmup" | "listening" | "roleplay" | "writing" | "review";
export type ChatMessage = { sender: "ai" | "learner"; text: string };

export function LessonTabBar({
  active,
  onChange
}: {
  active: LessonTab;
  onChange: (tab: LessonTab) => void;
}) {
  const tabs: Array<[LessonTab, string, React.ReactNode]> = [
    ["warmup", "1. Vocabulary", <BookOpen key="warmup" size={16} />],
    ["listening", "2. Listening", <Volume2 key="listening" size={16} />],
    ["roleplay", "3. Roleplay", <MessageSquare key="roleplay" size={16} />],
    ["writing", "4. Writing", <PenTool key="writing" size={16} />],
    ["review", "5. Review", <Check key="review" size={16} />]
  ];

  return (
    <div className="tabs-header">
      {tabs.map(([id, label, icon]) => (
        <button
          type="button"
          key={id}
          className={`tab-btn ${active === id ? "active" : ""}`}
          onClick={() => onChange(id)}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

export function LessonWarmup({
  lesson,
  onContinue
}: {
  lesson: LessonPackV1;
  onContinue: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="panel">
        <h2>Situation Context</h2>
        <p>{lesson.pre_listening.context_brief}</p>
      </div>
      <div className="split">
        <div className="panel">
          <h2>Prediction questions</h2>
          <ul>
            {lesson.pre_listening.prediction_questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>Key phrases to notice</h2>
          {lesson.pre_listening.key_phrases_to_notice.map((phrase) => (
            <span key={phrase} className="badge level-b1">{phrase}</span>
          ))}
        </div>
      </div>
      <button type="button" className="icon-btn" onClick={onContinue}>
        <ArrowRight size={16} />
        <span>Continue to listening</span>
      </button>
    </div>
  );
}

export function LessonRoleplay({
  lesson,
  messages,
  input,
  index,
  setInput,
  onSend,
  onContinue
}: {
  lesson: LessonPackV1;
  messages: ChatMessage[];
  input: string;
  index: number;
  setInput: (value: string) => void;
  onSend: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="panel">
      <h2>Roleplay Simulation</h2>
      <p><strong>Your role:</strong> {lesson.roleplay.learner_role}</p>
      <div className="chat-container">
        {messages.map((message, messageIndex) => (
          <div
            key={`${message.sender}-${messageIndex}`}
            className={`chat-bubble ${message.sender}`}
          >
            <strong>{message.sender === "ai" ? "AI Companion" : "You"}</strong>
            <br />
            {message.text}
          </div>
        ))}
      </div>
      {lesson.roleplay.turns[index] ? (
        <p className="status pending">Goal: {lesson.roleplay.turns[index].learner_goal}</p>
      ) : null}
      <div className="actions">
        <input
          aria-label="Roleplay response"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSend();
          }}
        />
        <button type="button" className="icon-btn" onClick={onSend} disabled={!input.trim()}>
          <Send size={16} />
          <span>Send response</span>
        </button>
        <button type="button" className="secondary" onClick={onContinue}>
          Continue to writing
        </button>
      </div>
    </div>
  );
}

export function PageMessage({
  message,
  rejected = false,
  onRetry,
  source = null,
  onReconnect
}: {
  message: string;
  rejected?: boolean;
  onRetry?: () => void;
  source?: DataSource | null;
  onReconnect?: () => void;
}) {
  return (
    <main className="page">
      <DataSourceNotice source={source} onReconnect={onReconnect ?? noop} />
      <p className={`status ${rejected ? "rejected" : "pending"}`}>{message}</p>
      {onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}
    </main>
  );
}

function noop() {}

export function summaryFromAttempt(attempt?: ListeningAttempt) {
  if (!attempt) return "";
  const score = Math.round(
    ((attempt.scoreGist + attempt.scoreDetail + attempt.scoreKeyPhrase) / 3) * 100
  );
  return [
    `Gist answers: ${attempt.gistAnswers.join(" | ")}`,
    `Detail answers: ${attempt.detailAnswers.join(" | ")}`,
    `score: ${score}`,
    `replays: ${attempt.replayCount}`
  ].join("; ");
}
