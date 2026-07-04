"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Send,
  ClipboardCheck,
  ArrowRight,
  BookOpen,
  Volume2,
  MessageSquare,
  PenTool,
  Check
} from "lucide-react";
import {
  mockGetLessonDetail,
  mockSaveListeningAttempt,
  mockSaveWritingFeedback,
  mockCompleteRetryDrill,
  type MockLessonDetail,
  type MockListeningAttempt,
  type MockRetryDrill
} from "@/src/lib/mockStore";
import { validFeedback } from "@/src/demo/lesson-pack-fixture";

interface Props {
  id: number;
}

type TabType = "warmup" | "listening" | "roleplay" | "writing" | "review";

export function LessonDetailPageClient({ id }: Props) {
  const [detail, setDetail] = useState<MockLessonDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("warmup");

  // Listening state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [replayCount, setReplayCount] = useState(1);
  const [gistInputs, setGistInputs] = useState<string[]>([]);
  const [detailInputs, setDetailInputs] = useState<string[]>([]);
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningScores, setListeningScores] = useState({ gist: 0, detail: 0 });
  const [waveAnimation, setWaveAnimation] = useState<number[]>(Array(30).fill(6));
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Roleplay chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "learner"; text: string }>>([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [userChatInput, setUserChatInput] = useState("");

  // Writing state
  const [writingInput, setWritingInput] = useState("");
  const [writingChecked, setWritingChecked] = useState(false);
  const [writingScores, setWritingScores] = useState<any>(null);

  // Drills state
  const [drillAnswers, setDrillAnswers] = useState<Record<number, string>>({});
  const [completedDrillIds, setCompletedDrillIds] = useState<number[]>([]);

  useEffect(() => {
    const data = mockGetLessonDetail(id);
    if (data) {
      setDetail(data);
      // Pre-fill question inputs
      setGistInputs(Array(data.lesson.while_listening.gist_questions.length).fill(""));
      setDetailInputs(Array(data.lesson.while_listening.detail_questions.length).fill(""));

      // Pre-fill first chat message
      if (data.lesson.roleplay.turns.length > 0) {
        setChatMessages([
          { sender: "ai", text: data.lesson.roleplay.turns[0].ai_prompt }
        ]);
      }
    }
  }, [id]);

  // Audio Playback simulation
  useEffect(() => {
    if (isPlaying) {
      const duration = detail?.lesson.listening_input.duration_seconds || 60;
      audioIntervalRef.current = setInterval(() => {
        setAudioSeconds((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            return duration;
          }
          return prev + 1;
        });
        // Randomize waveform height to simulate audio volume
        setWaveAnimation(Array(30).fill(0).map(() => Math.floor(Math.random() * 20) + 4));
      }, 1000);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setWaveAnimation(Array(30).fill(6));
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlaying, detail]);

  if (!detail) {
    return (
      <div className="page" style={{ textAlign: "center", padding: "100px" }}>
        <p className="status pending">Loading lesson information...</p>
      </div>
    );
  }

  const { lesson, listeningAttempts, retryDrills } = detail;

  // Handle Play/Pause
  function togglePlay() {
    if (!isPlaying) {
      if (audioSeconds >= lesson.listening_input.duration_seconds) {
        setAudioSeconds(0);
        setReplayCount((prev) => prev + 1);
      }
    }
    setIsPlaying(!isPlaying);
  }

  // Listening checks verification
  async function verifyListening() {
    // Scoring logic (simulated validation)
    const scoreGist = gistInputs.every(val => val.trim().length > 3) ? 1.0 : 0.0;
    const scoreDetail = detailInputs.every(val => val.trim().length > 3) ? 1.0 : 0.5;

    setListeningScores({ gist: scoreGist * 100, detail: scoreDetail * 100 });
    setListeningChecked(true);

    const attemptData = {
      gistAnswers: gistInputs,
      detailAnswers: detailInputs,
      keyPhraseAnswers: [lesson.while_listening.key_phrase_recognition[0]?.phrase || ""],
      replayCount,
      scoreGist,
      scoreDetail,
      scoreKeyPhrase: 1.0,
      missedDetails: scoreDetail < 1.0 ? ["Time proposed details"] : []
    };

    try {
      await fetch(`/api/listening-attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonPackId: id, ...attemptData })
      });
    } catch (e) {
      mockSaveListeningAttempt(id, attemptData);
    }

    // Refresh lesson data
    const updated = mockGetLessonDetail(id);
    if (updated) setDetail(updated);
  }

  // Send a message in Roleplay chat
  function handleSendChat() {
    if (!userChatInput.trim()) return;

    const newMsgs = [...chatMessages, { sender: "learner" as const, text: userChatInput }];
    setChatMessages(newMsgs);
    setUserChatInput("");

    const nextIndex = currentChatIndex + 1;
    if (nextIndex < lesson.roleplay.turns.length) {
      // Simulate AI typing after delay
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          { sender: "ai" as const, text: lesson.roleplay.turns[nextIndex].ai_prompt }
        ]);
        setCurrentChatIndex(nextIndex);
      }, 1000);
    } else {
      // Conversation complete
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          { sender: "ai" as const, text: "Excellent! We have successfully completed our session. You did great." }
        ]);
      }, 1000);
    }
  }

  // Live checker for writing task constraints
  function checkConstraint(constraint: string) {
    const text = writingInput.toLowerCase();
    if (constraint.toLowerCase().includes("polite")) {
      return text.includes("please") || text.includes("sorry") || text.includes("would") || text.includes("could");
    }
    if (constraint.toLowerCase().includes("scheduling conflict")) {
      return text.includes("scheduling conflict") || text.includes("conflict");
    }
    if (constraint.toLowerCase().includes("friday at 3")) {
      return text.includes("friday") && text.includes("3");
    }
    const words = constraint.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return words.some(w => text.includes(w));
  }

  // Live checker for vocabulary chunk usage
  function checkChunkUsed(phrase: string) {
    const cleanPhrase = phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const words = cleanPhrase.split(" ");
    const text = writingInput.toLowerCase();
    if (text.includes(cleanPhrase)) return true;
    const matchCount = words.filter(w => w.length > 3 && text.includes(w)).length;
    return matchCount >= 2;
  }

  // Submit writing feedback
  async function submitWriting() {
    setWritingChecked(true);
    const usedChunksCount = lesson.writing_task.target_chunks_to_use.filter(checkChunkUsed).length;
    const matchedConstraints = lesson.writing_task.constraints.filter(checkConstraint).length;

    const chunkScore = usedChunksCount / lesson.writing_task.target_chunks_to_use.length;
    const constraintScore = matchedConstraints / lesson.writing_task.constraints.length;
    const avgScore = Math.round((chunkScore + constraintScore) * 50 + 50);

    setWritingScores({
      score: avgScore,
      feedbackText: `Feedback: Excellent effort! You correctly incorporated ${usedChunksCount} out of ${lesson.writing_task.target_chunks_to_use.length} target vocabulary items.`
    });

    try {
      await fetch(`/api/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonPackId: id, feedback: validFeedback })
      });
    } catch (e) {
      mockSaveWritingFeedback(id, validFeedback);
    }

    const updated = mockGetLessonDetail(id);
    if (updated) setDetail(updated);
  }

  // Complete a retry drill challenge
  async function submitDrill(drillId: number) {
    const answer = drillAnswers[drillId];
    if (!answer) return;

    try {
      await fetch(`/api/retry-drills/${drillId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ learnerResult: answer })
      });
    } catch (e) {
      mockCompleteRetryDrill(id, drillId, answer);
    }

    setCompletedDrillIds(prev => [...prev, drillId]);

    const updated = mockGetLessonDetail(id);
    if (updated) setDetail(updated);
  }

  return (
    <main className="page">
      {/* Header bar aligned lineup */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <Link href="/" className="icon-btn" style={{ fontSize: "14px", color: "var(--accent-strong)", fontWeight: "600", padding: "6px 12px", minHeight: "32px", minWidth: "32px", borderRadius: "16px", marginBottom: "8px" }}>
            <ArrowLeft size={16} />
            <span>Back to practice</span>
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>{lesson.topic}</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>{lesson.situation}</p>
        </div>
        <span className={`badge level-${lesson.cefr_level.toLowerCase()}`} style={{ fontSize: "14px", padding: "6px 14px", borderRadius: "8px" }}>
          Level {lesson.cefr_level}
        </span>
      </div>

      {/* Steps checklist layout lineup */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === "warmup" ? "active" : ""}`} onClick={() => setActiveTab("warmup")}>
          <BookOpen size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          1. Vocabulary Warmup
        </button>
        <button className={`tab-btn ${activeTab === "listening" ? "active" : ""}`} onClick={() => setActiveTab("listening")}>
          <Volume2 size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          2. Listening Practice
        </button>
        <button className={`tab-btn ${activeTab === "roleplay" ? "active" : ""}`} onClick={() => setActiveTab("roleplay")}>
          <MessageSquare size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          3. Speaking Roleplay
        </button>
        <button className={`tab-btn ${activeTab === "writing" ? "active" : ""}`} onClick={() => setActiveTab("writing")}>
          <PenTool size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          4. Writing Challenge
        </button>
        <button className={`tab-btn ${activeTab === "review" ? "active" : ""}`} onClick={() => setActiveTab("review")}>
          <Check size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          5. Review & Drills
        </button>
      </div>

      {/* Tab 1: Vocab Warmup */}
      {activeTab === "warmup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <h2>Situation Context</h2>
            <p style={{ color: "var(--text)" }}>{lesson.pre_listening.context_brief}</p>
          </div>

          <div className="split">
            <div className="panel">
              <h2>Prediction Warmup Questions</h2>
              <ul className="plain-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {lesson.pre_listening.prediction_questions.map((q, idx) => (
                  <li key={idx} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.01)" }}>
                    <strong style={{ color: "var(--accent-strong)", display: "block", fontSize: "13px", marginBottom: "4px" }}>Warmup #{idx + 1}</strong>
                    <p style={{ fontSize: "14px" }}>{q}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <h2>Key phrases to notice</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {lesson.pre_listening.key_phrases_to_notice.map((phrase) => (
                  <span key={phrase} className="badge level-b1" style={{ fontSize: "13px", padding: "6px 12px" }}>
                    🔑 {phrase}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="actions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="icon-btn" onClick={() => setActiveTab("listening")}>
              <ArrowRight size={16} />
              <span>Continue to Listening Practice</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Listening Practice */}
      {activeTab === "listening" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Audio Player Sim */}
          <div className="audio-player">
            <div className="audio-controls">
              <button
                type="button"
                className="play-btn"
                onClick={togglePlay}
                style={{ width: "44px", height: "44px", borderRadius: "50%", padding: "0" }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: "2px" }} />}
              </button>
              <div className="waveform">
                {waveAnimation.map((h, i) => (
                  <div
                    key={i}
                    className={`wave-bar ${isPlaying ? "active" : ""}`}
                    style={{ height: `${h * 1.5}px`, background: i / 30 <= audioSeconds / lesson.listening_input.duration_seconds ? "var(--accent)" : "var(--line)" }}
                  />
                ))}
              </div>
              <div className="field" style={{ minWidth: "120px" }}>
                <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(e.target.value)} style={{ minHeight: "36px", padding: "6px" }}>
                  <option value="0.8x">Speed: 0.8x</option>
                  <option value="1.0x">Speed: 1.0x</option>
                  <option value="1.2x">Speed: 1.2x</option>
                </select>
              </div>
            </div>
            <div className="audio-meta">
              <span>Voice: {lesson.listening_input.recommended_voice} ({lesson.listening_input.accent})</span>
              <span>
                {Math.floor(audioSeconds / 60)}:{(audioSeconds % 60).toString().padStart(2, '0')} / {Math.floor(lesson.listening_input.duration_seconds / 60)}:{(lesson.listening_input.duration_seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="split">
            <div className="panel">
              <h2>Gist Comprehension Checks</h2>
              {lesson.while_listening.gist_questions.map((q, idx) => (
                <div key={idx} className="field" style={{ marginBottom: "16px" }}>
                  <label htmlFor={`gist-${idx}`}>{q.question}</label>
                  <textarea
                    id={`gist-${idx}`}
                    value={gistInputs[idx] || ""}
                    placeholder="Type what you understood of the overall conversation theme..."
                    onChange={(e) => {
                      const updated = [...gistInputs];
                      updated[idx] = e.target.value;
                      setGistInputs(updated);
                    }}
                    style={{ minHeight: "70px" }}
                    disabled={listeningChecked}
                  />
                  {listeningChecked && (
                    <div style={{ marginTop: "8px", fontSize: "13px", padding: "10px", borderRadius: "6px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      <strong style={{ color: "var(--accent-strong)" }}>Suggested answer:</strong> {q.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="panel">
              <h2>Detail Comprehension Checks</h2>
              {lesson.while_listening.detail_questions.map((q, idx) => (
                <div key={idx} className="field" style={{ marginBottom: "16px" }}>
                  <label htmlFor={`detail-${idx}`}>{q.question}</label>
                  <textarea
                    id={`detail-${idx}`}
                    value={detailInputs[idx] || ""}
                    placeholder="Provide specific names, times, actions or reasons..."
                    onChange={(e) => {
                      const updated = [...detailInputs];
                      updated[idx] = e.target.value;
                      setDetailInputs(updated);
                    }}
                    style={{ minHeight: "70px" }}
                    disabled={listeningChecked}
                  />
                  {listeningChecked && (
                    <div style={{ marginTop: "8px", fontSize: "13px", padding: "10px", borderRadius: "6px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      <strong style={{ color: "var(--accent-strong)" }}>Suggested answer:</strong> {q.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transcript Unlock */}
          {listeningChecked ? (
            <div className="panel" style={{ borderLeft: "3px solid var(--accent)" }}>
              <h2>Unlocked Transcript</h2>
              <pre className="transcript">{lesson.listening_input.script}</pre>
            </div>
          ) : (
            <p className="status pending">
              🔒 Complete comprehension checks to unlock the full audio transcript.
            </p>
          )}

          <div className="actions" style={{ justifyContent: "space-between" }}>
            <div>
              {!listeningChecked ? (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={verifyListening}
                  disabled={gistInputs.every(v => !v) && detailInputs.every(v => !v)}
                >
                  <CheckCircle size={16} />
                  <span>Verify & Check Answers</span>
                </button>
              ) : (
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <span className="badge level-b1" style={{ background: "var(--accent-glow)", color: "var(--accent-strong)", fontSize: "14px", padding: "6px 12px" }}>
                    Gist Score: {listeningScores.gist}%
                  </span>
                  <span className="badge level-b1" style={{ background: "var(--accent-glow)", color: "var(--accent-strong)", fontSize: "14px", padding: "6px 12px" }}>
                    Detail Score: {listeningScores.detail}%
                  </span>
                </div>
              )}
            </div>
            <button type="button" className="secondary icon-btn" onClick={() => setActiveTab("roleplay")}>
              <ArrowRight size={16} />
              <span>Proceed to Roleplay</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Speaking Roleplay */}
      {activeTab === "roleplay" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <h2>Roleplay Simulation</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "13px" }}>
              <span><strong>Your Role:</strong> {lesson.roleplay.learner_role}</span>
              <span><strong>Partner Role:</strong> {lesson.roleplay.ai_role}</span>
            </div>

            <div className="chat-container">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender}`}>
                  <strong style={{ fontSize: "10px", display: "block", color: msg.sender === "ai" ? "var(--accent-strong)" : "var(--danger-strong)", marginBottom: "4px" }}>
                    {msg.sender === "ai" ? "AI Companion" : "You"}
                  </strong>
                  {msg.text}
                </div>
              ))}
            </div>

            {currentChatIndex < lesson.roleplay.turns.length && (
              <div className="panel" style={{ background: "rgba(0,0,0,0.01)", marginBottom: "16px", border: "1px dashed var(--line)" }}>
                <span className="badge level-c1" style={{ marginBottom: "6px" }}>Goal objective</span>
                <p style={{ fontSize: "14px" }}>{lesson.roleplay.turns[currentChatIndex].learner_goal}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={userChatInput}
                placeholder="Type your response to the conversation turn..."
                onChange={(e) => setUserChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              />
              <button type="button" className="icon-btn" onClick={handleSendChat}>
                <Send size={16} />
                <span>Send response</span>
              </button>
            </div>
          </div>

          <div className="actions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="icon-btn" onClick={() => setActiveTab("writing")}>
              <ArrowRight size={16} />
              <span>Continue to Writing Challenge</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Writing Challenge */}
      {activeTab === "writing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <h2>Writing Prompt</h2>
            <p style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>{lesson.writing_task.task}</p>

            <div className="split" style={{ marginBottom: "20px" }}>
              {/* Constraints list */}
              <div>
                <h3>Constraints checklist</h3>
                <div className="constraint-list" style={{ marginTop: "10px" }}>
                  {lesson.writing_task.constraints.map((c) => {
                    const isMet = checkConstraint(c);
                    return (
                      <div key={c} className={`constraint-item ${isMet ? "checked" : ""}`}>
                        <span className="bullet"></span>
                        <span>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Chunks */}
              <div>
                <h3>Key vocabulary items to use</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                  {lesson.writing_task.target_chunks_to_use.map((chunk) => {
                    const isUsed = checkChunkUsed(chunk);
                    return (
                      <span
                        key={chunk}
                        className="badge"
                        style={{
                          background: isUsed ? "var(--accent-glow)" : "rgba(0,0,0,0.015)",
                          color: isUsed ? "var(--accent-strong)" : "var(--muted)",
                          borderColor: isUsed ? "var(--accent)" : "var(--line)",
                          fontSize: "12px",
                          padding: "6px 10px"
                        }}
                      >
                        {isUsed ? "✓" : "○"} {chunk}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="writingInput">Your Writing Solution</label>
              <textarea
                id="writingInput"
                value={writingInput}
                placeholder="Write your email/response here incorporating the target phrases..."
                onChange={(e) => setWritingInput(e.target.value)}
                style={{ minHeight: "150px" }}
                disabled={writingChecked}
              />
            </div>

            {writingChecked && writingScores && (
              <div className="panel" style={{ marginTop: "20px", borderLeft: "3px solid var(--accent)", background: "rgba(0,0,0,0.01)" }}>
                <h2>Writing Grade Analysis</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--accent-strong)" }}>{writingScores.score}/100</div>
                  <span style={{ fontSize: "14px", color: "var(--muted)" }}>Excellent Transfer Score</span>
                </div>
                <p style={{ fontSize: "14px", marginBottom: "16px" }}>{writingScores.feedbackText}</p>

                {/* Corrections diff */}
                <h3>AI Sentence Corrections</h3>
                <div className="prompt-preview" style={{ padding: "12px", background: "#141a17", color: "#e2eaf0", fontSize: "13px", marginTop: "8px" }}>
                  <div style={{ color: "var(--danger-strong)", textDecoration: "line-through", marginBottom: "4px" }}>- I want change meeting to Friday.</div>
                  <div style={{ color: "var(--accent-strong)" }}>+ I would like to reschedule the meeting for Friday.</div>
                  <div style={{ color: "#a3b899", fontSize: "12px", fontStyle: "italic", marginTop: "6px" }}>Why it matters: Using conditional polite phrases improves workplace tone.</div>
                </div>
              </div>
            )}

            <div className="actions" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="icon-btn"
                onClick={submitWriting}
                disabled={!writingInput.trim() || writingChecked}
              >
                <ClipboardCheck size={16} />
                <span>Submit & Get Feedback</span>
              </button>
              <button type="button" className="secondary icon-btn" onClick={() => setActiveTab("review")}>
                <ArrowRight size={16} />
                <span>Proceed to Drills</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Review & Drills */}
      {activeTab === "review" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <h2>Vocab Target Chunks recap</h2>
            <div className="vocab-grid">
              {lesson.post_listening.chunks.map((chunk) => (
                <div className="vocab-card" key={chunk.phrase}>
                  <h4>{chunk.phrase}</h4>
                  <p>{chunk.meaning}</p>
                  <span className="example">Ex: {chunk.example}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Retry Drills</h2>
            {retryDrills.length === 0 ? (
              <p className="status accepted">🎉 All checks completed successfully. No retry drills generated.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {retryDrills.map((drill) => {
                  const isDone = completedDrillIds.includes(drill.id) || !!drill.completedAt;
                  return (
                    <div key={drill.id} className="panel" style={{ background: "rgba(0,0,0,0.01)", borderColor: isDone ? "var(--accent)" : "var(--line)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3>{drill.instruction}</h3>
                        {isDone && <span className="badge level-b1">Completed</span>}
                      </div>

                      <div className="field" style={{ marginBottom: "12px" }}>
                        <label>Original Mistake</label>
                        <div style={{ padding: "10px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.01)", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                          {drill.items[0]}
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor={`drill-${drill.id}`}>Your Corrected Statement</label>
                        <input
                          id={`drill-${drill.id}`}
                          value={drillAnswers[drill.id] || drill.learnerResult || ""}
                          placeholder="Type the corrected sentence here..."
                          disabled={isDone}
                          onChange={(e) => {
                            setDrillAnswers({
                              ...drillAnswers,
                              [drill.id]: e.target.value
                            });
                          }}
                        />
                      </div>

                      {!isDone && (
                        <div className="actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => submitDrill(drill.id)}
                            disabled={!drillAnswers[drill.id]}
                          >
                            <Check size={16} />
                            <span>Submit Correction</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
