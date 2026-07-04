"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockGetDashboardSummary } from "@/src/lib/mockStore";

export function DashboardClient() {
  const [summary, setSummary] = useState<{
    completedTopics: number;
    completedRetryDrills: number;
    repeatedErrorTypes: Record<string, number>;
  }>({
    completedTopics: 0,
    completedRetryDrills: 0,
    repeatedErrorTypes: {}
  });

  useEffect(() => {
    setSummary(mockGetDashboardSummary());
  }, []);

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

      {/* Bento Grid: Metrics with SVG Circle Visuals */}
      <div className="metric-grid">
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
      </div>

      {/* Bento Section: Error Distribution Visualizations */}
      <div className="split">
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

        <div className="panel danger-zone">
          <h2>Review focus priority</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>
              <span>High priority drills</span>
              <strong style={{ color: "var(--danger-strong)" }}>1</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(245, 158, 11, 0.03)", border: "1px solid rgba(245, 158, 11, 0.1)", borderRadius: "8px" }}>
              <span>Medium priority drills</span>
              <strong style={{ color: "var(--warning)" }}>0</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
              <span>Completed review items</span>
              <strong style={{ color: "var(--accent-strong)" }}>{summary.completedRetryDrills}</strong>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
