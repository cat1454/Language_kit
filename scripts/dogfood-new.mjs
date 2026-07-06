import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const sessionsDir = join("eval", "dogfood_sessions");
const templatePath = join("eval", "dogfood_log_template.md");

const slugInput = process.argv[2] ?? "session";
const slug = slugInput
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

if (!slug) {
  console.error("Provide a slug with at least one letter or number.");
  process.exit(1);
}

const now = new Date();
const yyyy = String(now.getFullYear());
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const sessionPath = join(sessionsDir, `${yyyy}-${mm}-${dd}-${slug}.md`);

if (!existsSync(templatePath)) {
  console.error(`Missing dogfood template: ${templatePath}`);
  process.exit(1);
}

if (existsSync(sessionPath)) {
  console.error(`Dogfood session already exists: ${sessionPath}`);
  process.exit(1);
}

mkdirSync(sessionsDir, { recursive: true });
copyFileSync(templatePath, sessionPath);
console.log(`Created dogfood session template: ${sessionPath}`);
