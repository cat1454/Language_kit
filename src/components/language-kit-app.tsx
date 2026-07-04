"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Check,
  Download,
  Copy,
  Clipboard,
  Zap,
  Play
} from "lucide-react";
import { buildLessonPackPrompt, buildRepairPrompt } from "@/src/lib/prompts";
import { parseAiJson, validateLessonPack } from "@/src/lib/contracts";
import {
  mockGetLessons,
  mockSaveLesson,
  type MockLessonListItem
} from "@/src/lib/mockStore";

const defaultForm = {
  targetLanguage: "English",
  learnerNativeLanguage: "Vietnamese",
  cefrLevel: "B1",
  topic: "Reschedule a meeting",
  situation: "A workplace meeting must be moved because of a scheduling conflict.",
  sessionMinutes: 30,
  skillFocus: "listening first"
};

const presets = [
  {
    name: "📅 Meeting Reschedule",
    targetLanguage: "English",
    learnerNativeLanguage: "Vietnamese",
    cefrLevel: "B1",
    topic: "Reschedule a meeting",
    situation: "A workplace meeting must be moved because of a scheduling conflict.",
    sessionMinutes: 30,
    skillFocus: "listening first"
  },
  {
    name: "☕ London Coffee Shop",
    targetLanguage: "English",
    learnerNativeLanguage: "Vietnamese",
    cefrLevel: "A2",
    topic: "Order coffee in London",
    situation: "Ordering your favorite coffee at a busy cafe in London.",
    sessionMinutes: 20,
    skillFocus: "speaking practice"
  },
  {
    name: "💼 Job Interview Pitch",
    targetLanguage: "English",
    learnerNativeLanguage: "Vietnamese",
    cefrLevel: "C1",
    topic: "Job interview pitch",
    situation: "Presenting your background and skill focus concisely during a final round interview.",
    sessionMinutes: 45,
    skillFocus: "writing + speaking"
  }
];

export function LanguageKitApp() {
  const [form, setForm] = useState(defaultForm);
  const [prompt, setPrompt] = useState("");
  const [rawAiOutput, setRawAiOutput] = useState("");
  const [status, setStatus] = useState<{
    kind: "accepted" | "rejected" | "pending";
    message: string;
  } | null>(null);
  const [repairPrompt, setRepairPrompt] = useState("");
  const [lessons, setLessons] = useState<MockLessonListItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Load initial lessons on mount
  useEffect(() => {
    setLessons(mockGetLessons());
  }, []);

  const sessionMinutes = useMemo(
    () => Number(form.sessionMinutes) || 30,
    [form.sessionMinutes]
  );

  function updateField(
    field: keyof typeof defaultForm,
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function applyPreset(preset: typeof presets[0]) {
    const { name, ...fields } = preset;
    setForm(fields);
  }

  function generatePrompt() {
    const nextPrompt = buildLessonPackPrompt({
      ...form,
      sessionMinutes
    });
    setPrompt(nextPrompt);
    setStatus({ kind: "pending", message: "prompt ready" });
  }

  // Copy prompt text to clipboard
  async function copyPromptToClipboard() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (e) {
      // Fallback
    }
  }

  // Quick read clipboard and paste
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawAiOutput(text);
        setStatus({ kind: "pending", message: "Pasted from clipboard" });
      }
    } catch (e) {
      alert("Please allow clipboard access to paste.");
    }
  }

  // Instant fill mock data (no delay)
  async function instantAutofillMock() {
    let responseObj: any;
    if (form.topic.toLowerCase().includes("coffee")) {
      const { validLessonPack } = await import("@/src/demo/lesson-pack-fixture");
      responseObj = {
        ...validLessonPack,
        topic: "Order coffee in London",
        situation: "Ordering your favorite coffee at a busy cafe in London.",
        cefr_level: "A2"
      };
    } else if (form.topic.toLowerCase().includes("interview")) {
      const { validLessonPack } = await import("@/src/demo/lesson-pack-fixture");
      responseObj = {
        ...validLessonPack,
        topic: "Job interview pitch",
        situation: "Presenting your background and skill focus concisely during a final round interview.",
        cefr_level: "C1"
      };
    } else {
      const { validLessonPack } = await import("@/src/demo/lesson-pack-fixture");
      responseObj = validLessonPack;
    }

    setRawAiOutput(JSON.stringify(responseObj, null, 2));
    setStatus({ kind: "pending", message: "Mock JSON loaded instantly" });
  }

  // Simulations animation for JSON response
  async function simulateAiResponse() {
    setIsSimulating(true);
    setRawAiOutput("");
    setStatus({ kind: "pending", message: "Streaming AI response..." });

    // Determine mockup data based on topic/presets
    let responseObj: any;
    if (form.topic.toLowerCase().includes("coffee")) {
      const { validLessonPack } = await import("@/src/demo/lesson-pack-fixture");
      responseObj = {
        ...validLessonPack,
        topic: "Order coffee in London",
        situation: "Ordering your favorite coffee at a busy cafe in London.",
        cefr_level: "A2"
      };
    } else if (form.topic.toLowerCase().includes("interview")) {
      const { validLessonPack } = await import("@/src/demo/lesson-pack-fixture");
      responseObj = {
        ...validLessonPack,
        topic: "Job interview pitch",
        situation: "Presenting your background and skill focus concisely during a final round interview.",
        cefr_level: "C1"
      };
    } else {
      const { validLessonPack } = await import("@/src/demo/lesson-pack-fixture");
      responseObj = validLessonPack;
    }

    const fullText = JSON.stringify(responseObj, null, 2);

    // Simulate streaming by typing chunks
    let currentText = "";
    const totalSteps = 20;
    const stepSize = Math.ceil(fullText.length / totalSteps);
    let step = 0;

    const interval = setInterval(() => {
      if (step >= totalSteps) {
        clearInterval(interval);
        setRawAiOutput(fullText);
        setStatus({ kind: "pending", message: "AI response loaded" });
        setIsSimulating(false);
      } else {
        currentText += fullText.slice(step * stepSize, (step + 1) * stepSize);
        setRawAiOutput(currentText);
        step++;
      }
    }, 60);
  }

  async function validateAndSave() {
    setIsSaving(true);
    setStatus(null);
    setRepairPrompt("");

    try {
      // First try to hit local backend API
      const response = await fetch("/api/lesson-packs", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          rawAiOutput,
          sourceMode: "manual_free_relay",
          providerOrSite: "manual",
          modelName: "unknown",
          sessionMinutes
        })
      });
      const data = await response.json();

      if (!response.ok) {
        const errors = Array.isArray(data.errors) ? data.errors : [data.error];
        setStatus({
          kind: "rejected",
          message: data.rejectionReason ?? "rejected"
        });
        setRepairPrompt(
          buildRepairPrompt({
            brokenResponse: rawAiOutput,
            validationErrors: errors.filter(Boolean),
            expectedSchemaName: "lesson_pack.v1"
          })
        );
        return;
      }

      // If successful, save local mock store too so both match
      const parsed = parseAiJson(rawAiOutput);
      if (parsed.success) {
        const validated = validateLessonPack(parsed.data);
        if (validated.success) {
          mockSaveLesson(prompt, rawAiOutput, validated.data);
        }
      }

      setStatus({ kind: "accepted", message: "accepted" });
      // Reload from mock store to capture the full list properly
      setLessons(mockGetLessons());
    } catch (error) {
      // BACKEND FALLBACK: Parse and Save directly on the client if backend fetch fails
      const parsed = parseAiJson(rawAiOutput);
      if (!parsed.success) {
        setStatus({
          kind: "rejected",
          message: parsed.rejectionReason ?? "invalid_json"
        });
        setRepairPrompt(
          buildRepairPrompt({
            brokenResponse: rawAiOutput,
            validationErrors: parsed.errors,
            expectedSchemaName: "lesson_pack.v1"
          })
        );
        setIsSaving(false);
        return;
      }

      const validated = validateLessonPack(parsed.data);
      if (!validated.success) {
        setStatus({
          kind: "rejected",
          message: validated.rejectionReason ?? "missing_required_section"
        });
        setRepairPrompt(
          buildRepairPrompt({
            brokenResponse: rawAiOutput,
            validationErrors: validated.errors,
            expectedSchemaName: "lesson_pack.v1"
          })
        );
        setIsSaving(false);
        return;
      }

      // Save to local Mock Store
      const savedLesson = mockSaveLesson(prompt, rawAiOutput, validated.data);

      setStatus({ kind: "accepted", message: "accepted" });
      setLessons((current) => [savedLesson, ...current]);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page">
      <div className="section-header">
        <h1>Practice Workspace</h1>
        <p>Dynamic listening, roleplay and writing simulator</p>
      </div>

      <div className="workspace">
        {/* Left Form: Topic Setup */}
        <section className="panel">
          <h2>Select Topic</h2>

          <div className="field" style={{ marginBottom: "12px" }}>
            <label>Topic Presets</label>
            <div className="presets-container">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="preset-chip"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="split">
              <div className="field">
                <label htmlFor="targetLanguage">Target language</label>
                <input
                  id="targetLanguage"
                  value={form.targetLanguage}
                  onChange={(event) => updateField("targetLanguage", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="learnerNativeLanguage">Native language</label>
                <input
                  id="learnerNativeLanguage"
                  value={form.learnerNativeLanguage}
                  onChange={(event) =>
                    updateField("learnerNativeLanguage", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="split">
              <div className="field">
                <label htmlFor="cefrLevel">CEFR level</label>
                <input
                  id="cefrLevel"
                  value={form.cefrLevel}
                  onChange={(event) => updateField("cefrLevel", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="sessionMinutes">Session minutes</label>
                <input
                  id="sessionMinutes"
                  min={5}
                  type="number"
                  value={form.sessionMinutes}
                  onChange={(event) =>
                    updateField("sessionMinutes", Number(event.target.value))
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="topic">Topic</label>
              <input
                id="topic"
                value={form.topic}
                onChange={(event) => updateField("topic", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="situation">Situation</label>
              <textarea
                id="situation"
                value={form.situation}
                onChange={(event) => updateField("situation", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="skillFocus">Skill focus</label>
              <input
                id="skillFocus"
                value={form.skillFocus}
                onChange={(event) => updateField("skillFocus", event.target.value)}
              />
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              onClick={generatePrompt}
              className="icon-btn"
              style={{ width: "100%" }}
            >
              <Sparkles size={16} />
              <span>Generate prompt</span>
            </button>
          </div>
        </section>

        {/* Right Panel: Prompt & JSON Relay */}
        <section className="panel">
          <h2>AI Relay Interface</h2>

          <div className="field" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label>Generated Prompt</label>
              {prompt && (
                <button
                  type="button"
                  className="preset-chip icon-btn"
                  style={{ marginLeft: "auto", padding: "6px 12px", minHeight: "32px", minWidth: "32px", borderRadius: "16px" }}
                  onClick={copyPromptToClipboard}
                >
                  <Copy size={14} />
                  <span>{copiedPrompt ? "Copied" : "Copy Prompt"}</span>
                </button>
              )}
            </div>
            <pre className="prompt-preview" data-testid="prompt-preview">
              {prompt || "Configuration prompt will appear here after clicking Generate."}
            </pre>
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
              <label htmlFor="rawAiOutput">AI JSON response</label>

              <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="preset-chip icon-btn"
                  style={{ padding: "6px 12px", minHeight: "32px", minWidth: "32px", borderRadius: "16px" }}
                  onClick={pasteFromClipboard}
                >
                  <Clipboard size={14} />
                  <span>Paste Clipboard</span>
                </button>
                {prompt && (
                  <>
                    <button
                      type="button"
                      className="preset-chip icon-btn"
                      style={{ padding: "6px 12px", minHeight: "32px", minWidth: "32px", borderRadius: "16px", border: "1px solid var(--accent)", color: "var(--accent-strong)" }}
                      onClick={instantAutofillMock}
                    >
                      <Zap size={14} />
                      <span>Fast Fill</span>
                    </button>
                    <button
                      type="button"
                      className="preset-chip icon-btn"
                      style={{ padding: "6px 12px", minHeight: "32px", minWidth: "32px", borderRadius: "16px", border: "1px solid var(--accent)", color: "var(--accent-strong)" }}
                      onClick={simulateAiResponse}
                      disabled={isSimulating}
                    >
                      <Play size={14} />
                      <span>Stream Fill</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              id="rawAiOutput"
              value={rawAiOutput}
              placeholder="Paste raw JSON here, or click 'Fast Fill' / 'Stream Fill' to load mock data."
              onChange={(event) => setRawAiOutput(event.target.value)}
              style={{ fontFamily: "var(--font-mono)", fontSize: "13px", height: "180px" }}
            />
          </div>

          <div className="actions">
            <button
              type="button"
              className="icon-btn"
              disabled={!prompt || !rawAiOutput || isSaving || isSimulating}
              onClick={validateAndSave}
            >
              <Check size={16} />
              <span>Validate and save</span>
            </button>
            <Link className="button secondary icon-btn" href="/exports">
              <Download size={16} />
              <span>Dataset Exports</span>
            </Link>
          </div>

          {status ? (
            <p
              className={`status ${status.kind}`}
              data-testid="validation-status"
            >
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "currentColor" }}></span>
              {status.message}
            </p>
          ) : null}

          {repairPrompt ? (
            <div className="field" style={{ marginTop: "16px" }}>
              <label>Repair Prompt Suggested</label>
              <pre className="prompt-preview" data-testid="repair-prompt" style={{ borderLeft: "3px solid var(--danger)" }}>
                {repairPrompt}
              </pre>
            </div>
          ) : null}
        </section>
      </div>

      {/* Bento Grid: Saved Lessons */}
      <section className="panel" style={{ marginTop: "28px" }}>
        <h2>Available Practice Lessons</h2>
        {lessons.length === 0 ? (
          <p className="muted">No lessons generated yet. Create one above to begin.</p>
        ) : (
          <div className="item-grid">
            {lessons.map((lesson) => (
              <Link
                className="item-card"
                href={`/lessons/${lesson.id}`}
                key={lesson.id}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <span className={`badge level-${lesson.cefrLevel.toLowerCase()}`}>{lesson.cefrLevel}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {new Date(lesson.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <strong>{lesson.topic}</strong>
                  <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {lesson.situation}
                  </p>
                </div>
                <div className="card-meta">
                  <span style={{ color: "var(--accent-strong)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    Practice →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
