import { afterEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getDatasetExportRows: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/exports/:kind", () => {
  it("streams repository rows as valid JSONL", async () => {
    repositoryMocks.getDatasetExportRows.mockResolvedValueOnce([
      { task_type: "feedback_scoring", accepted: true },
      { task_type: "feedback_scoring", accepted: false }
    ]);
    const { GET } = await import("@/app/api/exports/[kind]/route");

    const response = await GET(new Request("http://localhost/api/exports/feedback_scoring_sft"), {
      params: Promise.resolve({ kind: "feedback_scoring_sft" })
    });
    const body = await response.text();
    const lines = body.trimEnd().split("\n");

    expect(response.status).toBe(200);
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => JSON.parse(line))).toEqual([
      { task_type: "feedback_scoring", accepted: true },
      { task_type: "feedback_scoring", accepted: false }
    ]);
  });

  it("returns 404 for unknown export kinds", async () => {
    const { GET } = await import("@/app/api/exports/[kind]/route");

    const response = await GET(new Request("http://localhost/api/exports/nope"), {
      params: Promise.resolve({ kind: "nope" })
    });

    expect(response.status).toBe(404);
    expect(repositoryMocks.getDatasetExportRows).not.toHaveBeenCalled();
  });
});
