"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataSourceNotice } from "@/src/components/data-source-notice";
import { isBackendUnavailable, requestJson } from "@/src/lib/api-client";
import {
  clearSessionDataSource,
  getSessionDataSource,
  setSessionDataSource,
  type DashboardSummary,
  type DataSource
} from "@/src/lib/lesson-data";
import { mockGetDashboardSummary } from "@/src/lib/mockStore";

export function DashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary>({
    completedTopics: 0,
    completedRetryDrills: 0,
    repeatedErrorTypes: {}
  });
  const [source, setSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSummary();
  }, []);

  async function loadSummary() {
    setLoading(true);
    setError("");
    const pinnedSource = getSessionDataSource();
    if (pinnedSource === "demo") {
      setSummary(mockGetDashboardSummary());
      setSource("demo");
      setLoading(false);
      return;
    }

    try {
      const response = await requestJson<{ summary: DashboardSummary }>("/api/dashboard");
      setSummary(response.summary);
      setSource("api");
      setSessionDataSource("api");
    } catch (caught) {
      if (!pinnedSource && isBackendUnavailable(caught)) {
        setSummary(mockGetDashboardSummary());
        setSource("demo");
        setSessionDataSource("demo");
      } else {
        setError(caught instanceof Error ? caught.message : "Failed to load dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  function reconnect() {
    clearSessionDataSource();
    window.location.reload();
  }

  const totalErrors = Object.values(summary.repeatedErrorTypes).reduce((a, b) => a + b, 0);

  // SVG Gauge calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // Let's assume a target of 10 completed topics
  const topicsTarget = 10;
  const topicsPercent = Math.min((summary.completedTopics / topicsTarget) * 100, 100);
  const topicsStrokeDashoffset = circumference - (topicsPercent / 100) * circumference;

  // Let's assume a target of 20 completed drills
  const drillsTarget = 20;
  const drillsPercent = Math.min((summary.completedRetryDrills / drillsTarget) * 100, 100);
  const drillsStrokeDashoffset = circumference - (drillsPercent / 100) * circumference;

  return (
    <main className="page">
      <DataSourceNotice source={source} onReconnect={reconnect} />
      <div className="section-header" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Progress Dashboard</h1>
          <p>Personal AI language stats and error log tracking</p>
        </div>
        <Link href="/" className="button secondary icon-btn" style={{ padding: "8px 16px", borderRadius: "16px", minHeight: "36px", minWidth: "36px" }}>
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </Link>
      </div>
      {loading ? <p className="status pending">Loading dashboard...</p> : null}
      {error ? <p className="status rejected" role="alert">{error}</p> : null}

      {/* Bento Grid: Metrics with SVG Circle Visuals */}
      {!loading && !error ? <div className="metric-grid">
        <div className="metric">
          <div className="metric-info">
            <span>Completed Topics</span>
            <strong>{summary.completedTopics}</strong>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Target goal: {topicsTarget}</p>
          </div>
          <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={radius} stroke="var(--line)" strokeWidth="8" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--accent)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={topicsStrokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
        </div>

        <div className="metric">
          <div className="metric-info">
            <span>Completed Drills</span>
            <strong>{summary.completedRetryDrills}</strong>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Target goal: {drillsTarget}</p>
          </div>
          <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={radius} stroke="var(--line)" strokeWidth="8" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--accent)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={drillsStrokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
        </div>

        <div className="metric">
          <div className="metric-info">
            <span>Error log size</span>
            <strong>{totalErrors}</strong>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Total distinct error items</p>
          </div>
          <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={radius} stroke="var(--line)" strokeWidth="8" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--danger)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={totalErrors > 0 ? 0 : circumference}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
        </div>
      </div> : null}

      {!loading && !error ? (
        <div className="panel">
          <h2>Repeated error classifications</h2>
          {Object.entries(summary.repeatedErrorTypes).length === 0 ? (
            <p className="muted" style={{ padding: "20px 0" }}>No language errors recorded yet. Practice writing tasks to log feedback.</p>
          ) : (
            <div className="error-bar-container">
              {Object.entries(summary.repeatedErrorTypes).map(([type, count]) => {
                const percent = Math.min((count / totalErrors) * 100, 100);
                return (
                  <div className="error-bar-row" key={type}>
                    <span className="error-bar-label">{type}</span>
                    <div className="error-bar-track">
                      <div
                        className="error-bar-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="error-bar-value">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
