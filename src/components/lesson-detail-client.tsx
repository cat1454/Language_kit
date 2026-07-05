"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DataSourceNotice } from "@/src/components/data-source-notice";
import { LessonListeningPanel } from "@/src/components/lesson-listening-panel";
import { LessonReviewPanel } from "@/src/components/lesson-review-panel";
import { LessonSpeakingPanel } from "@/src/components/lesson-speaking-panel";
import { LessonWritingPanel } from "@/src/components/lesson-writing-panel";
import {
  LessonRoleplay,
  LessonTabBar,
  LessonWarmup,
  PageMessage,
  summaryFromAttempt,
  type ChatMessage,
  type LessonTab
} from "@/src/components/lesson-static-panels";
import { ApiError, isBackendUnavailable, requestJson } from "@/src/lib/api-client";
import { validateFeedback, type FeedbackV1 } from "@/src/lib/contracts";
import {
  clearSessionDataSource,
  getSessionDataSource,
  setSessionDataSource,
  type DataSource,
  type FeedbackResponse,
  type LessonDetail,
  type ListeningAttempt,
  type RoleplayTurn,
  type WritingSubmission
} from "@/src/lib/lesson-data";
import { parseManualFeedbackJson } from "@/src/lib/manual-feedback-json";
import {
  mockCompleteRetryDrill,
  mockGetLessonDetail,
  mockSaveListeningAttempt,
  mockSaveWritingFeedback
} from "@/src/lib/mockStore";

type AttemptInput = Omit<ListeningAttempt, "id" | "lessonPackId" | "createdAt">;
type RoleplayResponse = { roleplayTurn: RoleplayTurn };
type WritingDraftResponse = { writingSubmission: WritingSubmission };

export function LessonDetailPageClient({ id }: { id: number }) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [source, setSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<LessonTab>("warmup");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatIndex, setChatIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [roleplayError, setRoleplayError] = useState("");
  const [roleplaySaving, setRoleplaySaving] = useState(false);
  const [listeningSummary, setListeningSummary] = useState("");

  useEffect(() => {
    void loadDetail();
  }, [id]);

  useEffect(() => {
    if (!detail) return;
    const chat = buildChatState(detail);
    setChatMessages(chat.messages);
    setChatIndex(chat.index);
  }, [detail]);

  const roleplayResponses = useMemo(
    () => chatMessages.filter((message) => message.sender === "learner").map((message) => message.text),
    [chatMessages]
  );

  async function loadDetail() {
    setLoading(true);
    setLoadError("");
    setNotFound(false);
    const pinnedSource = getSessionDataSource();

    if (pinnedSource === "demo") {
      loadDemoDetail();
      return;
    }

    try {
      const response = await requestJson<{ detail: LessonDetail }>(`/api/lesson-packs/${id}`);
      setDetail(response.detail);
      setSource("api");
      setSessionDataSource("api");
      setListeningSummary(summaryFromAttempt(response.detail.listeningAttempts[0]));
      setLoading(false);
    } catch (error) {
      if (!pinnedSource && isBackendUnavailable(error)) {
        setSessionDataSource("demo");
        loadDemoDetail();
      } else if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
        setLoading(false);
      } else {
        setLoadError(error instanceof Error ? error.message : "Failed to load lesson.");
        setLoading(false);
      }
    }
  }

  function loadDemoDetail() {
    const local = mockGetLessonDetail(id);
    setDetail(local);
    setSource("demo");
    setNotFound(!local);
    setListeningSummary(summaryFromAttempt(local?.listeningAttempts[0]));
    setLoading(false);
  }

  async function refreshDetail() {
    if (source === "demo") {
      const local = mockGetLessonDetail(id);
      if (local) setDetail(local);
      return;
    }
    const response = await requestJson<{ detail: LessonDetail }>(`/api/lesson-packs/${id}`);
    setDetail(response.detail);
  }

  function reconnect() {
    clearSessionDataSource();
    window.location.reload();
  }

  async function saveListening(attempt: AttemptInput) {
    if (source === "demo") {
      mockSaveListeningAttempt(id, attempt);
    } else if (source === "api") {
      await requestJson("/api/listening-attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonPackId: id, ...attempt })
      });
    } else {
      throw new Error("Lesson data source is not ready.");
    }
    await refreshDetail();
  }

  async function saveFeedback(prompt: string, rawAiOutput: string): Promise<FeedbackV1> {
    if (source === "demo") {
      const parsed = parseManualFeedbackJson(rawAiOutput);
      if (!parsed.success) throw new Error(parsed.errors.join("; "));
      const validated = validateFeedback(parsed.data);
      if (!validated.success) throw new Error(validated.errors.join("; "));
      mockSaveWritingFeedback(id, validated.data);
      await refreshDetail();
      return validated.data;
    }
    if (source !== "api") throw new Error("Lesson data source is not ready.");

    const response = await requestJson<FeedbackResponse>("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lessonPackId: id,
        prompt,
        rawAiOutput,
        sourceMode: "manual_free_relay",
        providerOrSite: "manual",
        modelName: "unknown"
      })
    });
    await refreshDetail();
    return response.feedback;
  }

  async function saveWritingDraft(draft: string) {
    if (source === "demo") return;
    if (source !== "api") throw new Error("Lesson data source is not ready.");
    const writingSubmissionId = detail?.writingSubmission?.id;
    if (!writingSubmissionId) throw new Error("Writing submission is not ready.");

    await requestJson<WritingDraftResponse>("/api/writing-submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lessonId: id, writingSubmissionId, draft })
    });
    await refreshDetail();
  }

  async function completeDrill(drillId: number, learnerResult: string) {
    if (source === "demo") {
      mockCompleteRetryDrill(id, drillId, learnerResult);
    } else if (source === "api") {
      await requestJson(`/api/retry-drills/${drillId}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ learnerResult })
      });
    } else {
      throw new Error("Lesson data source is not ready.");
    }
    await refreshDetail();
  }

  async function sendChat() {
    const response = chatInput.trim();
    if (!response || !detail) return;
    const currentTurn = detail.roleplayTurns?.find((turn) => turn.turnIndex === chatIndex + 1);
    setRoleplaySaving(true);
    setRoleplayError("");
    try {
      if (source === "api") {
        if (!currentTurn) throw new Error("Roleplay turn is not ready.");
        await requestJson<RoleplayResponse>("/api/roleplay-turns", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId: id, turnId: currentTurn.id, learnerResponse: response })
        });
        await refreshDetail();
      } else {
        const nextIndex = chatIndex + 1;
        const nextPrompt = detail.lesson.roleplay.turns[nextIndex]?.ai_prompt;
        setChatMessages((messages) => [
          ...messages,
          { sender: "learner", text: response },
          { sender: "ai", text: nextPrompt ?? "Roleplay complete. Continue to writing." }
        ]);
        setChatIndex(nextIndex);
      }
      setChatInput("");
    } catch (caught) {
      setRoleplayError(caught instanceof Error ? caught.message : "Failed to save roleplay response.");
    } finally {
      setRoleplaySaving(false);
    }
  }

  if (loading) return <PageMessage message="Loading lesson information..." source={source} onReconnect={reconnect} />;
  if (notFound) return <PageMessage message="Lesson not found." rejected source={source} onReconnect={reconnect} />;
  if (loadError || !detail) return <PageMessage message={loadError || "Failed to load lesson."} rejected onRetry={loadDetail} source={source} onReconnect={reconnect} />;

  const { lesson } = detail;
  return (
    <main className="page">
      <DataSourceNotice source={source} onReconnect={reconnect} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <Link href="/" className="icon-btn"><ArrowLeft size={16} /><span>Back to practice</span></Link>
          <h1>{lesson.topic}</h1><p className="muted">{lesson.situation}</p>
        </div>
        <span className={`badge level-${lesson.cefr_level.toLowerCase()}`}>Level {lesson.cefr_level}</span>
      </div>

      <LessonTabBar active={activeTab} onChange={setActiveTab} />
      {activeTab === "warmup" ? <LessonWarmup lesson={lesson} onContinue={() => setActiveTab("listening")} /> : null}
      {activeTab === "listening" ? (
        <LessonListeningPanel lesson={lesson} audioPath={detail.listeningInput?.audioPath ?? null} audioMetadata={detail.listeningInput?.audioMetadata ?? null} initialAttempt={detail.listeningAttempts[0]} onSave={saveListening} onComplete={setListeningSummary} onContinue={() => setActiveTab("roleplay")} />
      ) : null}
      {activeTab === "roleplay" ? (
        <>
          <LessonRoleplay lesson={lesson} messages={chatMessages} input={chatInput} index={chatIndex} saving={roleplaySaving} error={roleplayError} setInput={setChatInput} onSend={sendChat} onContinue={() => setActiveTab("writing")} />
          <LessonSpeakingPanel lessonId={id} source={source} promptRef={lesson.roleplay.turns[0]?.learner_goal ?? "Practice your roleplay response aloud."} />
        </>
      ) : null}
      {activeTab === "writing" ? <LessonWritingPanel lesson={lesson} initialDraft={detail.writingSubmission?.draft} roleplayResponses={roleplayResponses} listeningSummary={listeningSummary} onSaveDraft={saveWritingDraft} onSaveFeedback={saveFeedback} /> : null}
      {activeTab === "review" ? <LessonReviewPanel drills={detail.retryDrills} onComplete={completeDrill} /> : null}
    </main>
  );
}

function buildChatState(detail: LessonDetail): { messages: ChatMessage[]; index: number } {
  const turns = detail.roleplayTurns ?? [];
  if (turns.length === 0) {
    const firstPrompt = detail.lesson.roleplay.turns[0]?.ai_prompt;
    return { messages: firstPrompt ? [{ sender: "ai", text: firstPrompt }] : [], index: 0 };
  }

  const messages: ChatMessage[] = [];
  for (const turn of turns) {
    messages.push({ sender: "ai", text: turn.aiPrompt });
    if (!turn.learnerResponse) {
      return { messages, index: Math.max(turn.turnIndex - 1, 0) };
    }
    messages.push({ sender: "learner", text: turn.learnerResponse });
  }
  messages.push({ sender: "ai", text: "Roleplay complete. Continue to writing." });
  return { messages, index: turns.length };
}
