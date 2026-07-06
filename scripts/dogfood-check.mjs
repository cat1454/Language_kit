import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const sessionsDir = join("eval", "dogfood_sessions");
const templatePath = join("eval", "dogfood_log_template.md");

const normalize = (value) => value.replace(/\r\n/g, "\n").trim();

const evidenceFields = new Set([
  "Lesson prompt generated",
  "Lesson JSON accepted",
  "Repair prompt used",
  "Listening checks completed",
  "Transcript stayed gated until completion",
  "Roleplay response saved",
  "Writing draft saved",
  "Feedback JSON accepted",
  "Retry drill completed",
  "JSONL export inspected",
  "Rows look useful for future evaluation",
  "Add eval seed",
]);

const hasRealEvidence = (content) =>
  content.split(/\r?\n/).some((line) => {
    const match = line.match(/^- ([^:]+):\s*(.+)$/);
    if (!match || !evidenceFields.has(match[1].trim())) {
      return false;
    }

    const value = match[2].trim().toLowerCase();
    return value === "yes" || value === "no";
  });

if (!existsSync(sessionsDir)) {
  console.error(`No dogfood session directory found: ${sessionsDir}`);
  process.exit(1);
}

const template = existsSync(templatePath)
  ? normalize(readFileSync(templatePath, "utf8"))
  : "";

const sessionFiles = readdirSync(sessionsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
  .map((entry) => entry.name)
  .sort();

const realSessionFiles = sessionFiles.filter((fileName) => {
  const content = normalize(readFileSync(join(sessionsDir, fileName), "utf8"));
  return content && content !== template && hasRealEvidence(content);
});

if (realSessionFiles.length === 0) {
  console.error(
    "No real dogfood logs found. Use `pnpm dogfood:new <slug>`, fill it from a real session, then rerun this check.",
  );
  process.exit(1);
}

console.log("Real dogfood logs found:");
for (const fileName of realSessionFiles) {
  console.log(`- ${join(sessionsDir, fileName)}`);
}

const result = spawnSync("pnpm", ["eval:v0"], {
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
