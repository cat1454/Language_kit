import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_LIMIT = 300;
const SOURCE_ROOTS = ["app", "src", "tests", "scripts"];
const CODE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const BASELINE_PATH = path.join(ROOT, "tooling", "file-size-baseline.json");

const baseline = JSON.parse(await readFile(BASELINE_PATH, "utf8"));
const files = (await Promise.all(SOURCE_ROOTS.map(collectCodeFiles))).flat();
const counts = new Map();
const violations = [];

for (const file of files) {
  const relativePath = toPosix(path.relative(ROOT, file));
  const lineCount = countPhysicalLines(await readFile(file, "utf8"));
  const legacyLimit = baseline[relativePath];
  const allowedLimit = legacyLimit ?? DEFAULT_LIMIT;
  counts.set(relativePath, lineCount);

  if (lineCount > allowedLimit) {
    violations.push(`${relativePath}: ${lineCount} lines (limit ${allowedLimit})`);
  }
}

for (const [relativePath, legacyLimit] of Object.entries(baseline)) {
  const lineCount = counts.get(relativePath);

  if (lineCount === undefined) {
    violations.push(`${relativePath}: stale baseline entry; file does not exist`);
  } else if (lineCount <= DEFAULT_LIMIT) {
    violations.push(
      `${relativePath}: now ${lineCount} lines; remove its ${legacyLimit}-line baseline entry`
    );
  }
}

if (violations.length > 0) {
  console.error(`File-size check failed (new-file limit: ${DEFAULT_LIMIT} lines):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  const legacyCount = Object.keys(baseline).length;
  console.log(
    `File-size check passed: ${files.length} files checked, ${legacyCount} legacy exceptions frozen.`
  );
}

async function collectCodeFiles(relativeRoot) {
  const absoluteRoot = path.join(ROOT, relativeRoot);
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectCodeFiles(path.relative(ROOT, entryPath))));
    } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function countPhysicalLines(content) {
  if (content.length === 0) return 0;
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  return lines.at(-1) === "" ? lines.length - 1 : lines.length;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}
