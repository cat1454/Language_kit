import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const sessionPath =
  process.argv.find((arg) => arg.startsWith("--session="))?.slice("--session=".length) ??
  join("eval", "dogfood_sessions", "2026-07-05-reschedule-meeting.md");
const baseUrl =
  process.argv.find((arg) => arg.startsWith("--base-url="))?.slice("--base-url=".length) ??
  process.env.BASE_URL ??
  "http://localhost:3000";
const dryRun = process.argv.includes("--dry-run");

const prompts = [
  ["Lesson prompt generated", "Was the lesson prompt generated in the app?"],
  ["Lesson JSON accepted", "Was the real lesson JSON accepted?"],
  ["Repair prompt used", "Did you use a repair prompt?"],
  ["Listening checks completed", "Were listening checks completed?"],
  ["Transcript stayed gated until completion", "Did transcript gating behave correctly?"],
  ["Roleplay response saved", "Was the roleplay response saved?"],
  ["Writing draft saved", "Was the writing draft saved?"],
  ["Feedback JSON accepted", "Was the real feedback JSON accepted?"],
  ["Retry drill completed", "Was a retry drill completed?"],
  ["JSONL export inspected", "Did you inspect JSONL export rows?"],
  ["Rows look useful for future evaluation", "Did exported rows look useful?"],
  ["Add eval seed", "Does this session justify adding an eval seed?"]
];

if (!existsSync(sessionPath)) {
  console.error(`Missing dogfood session log: ${sessionPath}`);
  console.error("Create one first with `pnpm dogfood:new <slug>`.");
  process.exit(1);
}

if (dryRun) {
  console.log(`Dogfood assist ready for ${sessionPath} at ${baseUrl}`);
  process.exit(0);
}

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto(baseUrl);
await page.getByLabel("Target language").fill("English");
await page.getByLabel("Native language").fill("Vietnamese");
await page.getByLabel("CEFR level").fill("B1");
await page.getByLabel("Topic").fill("Reschedule a meeting");
await page
  .getByLabel("Situation")
  .fill("A workplace meeting must be moved because of a scheduling conflict.");
await page.getByLabel("Session minutes").fill("30");
await page.getByRole("button", { name: "Generate prompt" }).click();
await page.getByTestId("prompt-preview").waitFor({ state: "visible" });

console.log("Browser is open at the lesson prompt. Complete the real manual relay/session there.");
console.log("Return here afterward; answers are written to the dogfood log.");

const rl = createInterface({ input, output });
await rl.question("Press Enter after the real session evidence is ready...");

let content = readFileSync(sessionPath, "utf8");
for (const [field, question] of prompts) {
  const answer = await askYesNo(rl, `${question} (yes/no/skip) `);
  if (answer) {
    content = replaceField(content, field, answer);
  }
}

const rejectionReason = await rl.question("Rejection reason if rejected (blank to skip): ");
if (rejectionReason.trim()) {
  content = replaceField(content, "Rejection reason if rejected", rejectionReason.trim());
}

const missingExport = await rl.question("Missing metadata or confusing fields (blank to skip): ");
if (missingExport.trim()) {
  content = replaceField(content, "Missing metadata or confusing fields", missingExport.trim());
}

const evalRowId = await rl.question("Suggested eval row ID (blank to skip): ");
if (evalRowId.trim()) {
  content = replaceField(content, "Suggested eval row ID", evalRowId.trim());
}

const reason = await rl.question("Short reason (blank to skip): ");
if (reason.trim()) {
  content = replaceField(content, "Short reason", reason.trim());
}

writeFileSync(sessionPath, content);
rl.close();
await browser.close();
console.log(`Updated dogfood session log: ${sessionPath}`);
console.log("Run `pnpm dogfood:check` next.");

async function askYesNo(rl, question) {
  while (true) {
    const answer = (await rl.question(question)).trim().toLowerCase();
    if (answer === "skip" || answer === "") return null;
    if (answer === "yes" || answer === "no") return answer;
    console.log("Please answer yes, no, or skip.");
  }
}

function replaceField(content, field, value) {
  const pattern = new RegExp(`^- ${escapeRegExp(field)}:.*$`, "m");
  return content.replace(pattern, `- ${field}: ${value}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
