import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const LOCAL_STT_MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const LOCAL_STT_DEFAULT_TIMEOUT_MS = 30_000;

const MAX_STDOUT_BYTES = 64 * 1024;
const AUDIO_EXTENSIONS = new Set([".flac", ".m4a", ".mp3", ".ogg", ".wav", ".webm"]);
const optionPattern = /^[a-zA-Z0-9._-]+$/;
const outputSchema = z.object({
  transcript: z.string(),
  language: z.string().trim().min(1).max(32).optional(),
  durationMs: z.number().int().nonnegative().optional()
}).strict();

export type LocalSttInput = {
  audioFilePath: string;
  language?: string;
  engine?: string;
  consentConfirmed?: boolean;
};

export type LocalSttErrorCode =
  | "disabled"
  | "missing_audio_path"
  | "invalid_audio_path"
  | "invalid_options"
  | "consent_required"
  | "command_unavailable"
  | "unsupported_audio_type"
  | "audio_file_unavailable"
  | "audio_file_too_large"
  | "timeout"
  | "execution_failed"
  | "malformed_output"
  | "empty_transcript";

export type LocalSttResult =
  | {
      status: "transcribed";
      provider: "local_prototype";
      transcript: string;
      language?: string;
      durationMs?: number;
    }
  | {
      status: "unavailable" | "failed";
      provider: "local_prototype";
      errorCode: LocalSttErrorCode;
    };

export type LocalSttRunRequest = {
  command: string;
  args: string[];
  timeoutMs: number;
};

export type LocalSttRunResult =
  | { status: "completed"; stdout: string }
  | { status: "timeout" }
  | { status: "failed" };

export type LocalSttDependencies = {
  environment?: {
    LANGUAGE_KIT_LOCAL_STT_ENABLED?: string;
    LANGUAGE_KIT_LOCAL_STT_COMMAND?: string;
  };
  inspectFile?: (audioFilePath: string) => Promise<{
    isFile: boolean;
    sizeBytes: number;
  }>;
  run?: (request: LocalSttRunRequest) => Promise<LocalSttRunResult>;
  timeoutMs?: number;
  platform?: NodeJS.Platform;
};

export async function transcribeWithLocalSttPrototype(
  input: LocalSttInput,
  dependencies: LocalSttDependencies = {}
): Promise<LocalSttResult> {
  const audioFilePath = input.audioFilePath?.trim();
  if (!audioFilePath) return failure("failed", "missing_audio_path");

  const platform = dependencies.platform ?? process.platform;
  if (!isSafeLocalPath(audioFilePath, platform)) {
    return failure("failed", "invalid_audio_path");
  }
  if (input.consentConfirmed !== true) return failure("failed", "consent_required");
  if (!validOption(input.language) || !validOption(input.engine)) {
    return failure("failed", "invalid_options");
  }

  const environment = dependencies.environment ?? process.env;
  if (environment.LANGUAGE_KIT_LOCAL_STT_ENABLED !== "1") {
    return failure("unavailable", "disabled");
  }
  const command = environment.LANGUAGE_KIT_LOCAL_STT_COMMAND?.trim();
  if (!command || command.includes("\0")) {
    return failure("unavailable", "command_unavailable");
  }

  const pathApi = platform === "win32" ? path.win32 : path.posix;
  if (!AUDIO_EXTENSIONS.has(pathApi.extname(audioFilePath).toLowerCase())) {
    return failure("failed", "unsupported_audio_type");
  }

  const inspectFile = dependencies.inspectFile ?? inspectLocalFile;
  let file: { isFile: boolean; sizeBytes: number };
  try {
    file = await inspectFile(audioFilePath);
  } catch {
    return failure("unavailable", "audio_file_unavailable");
  }
  if (!file.isFile || !Number.isSafeInteger(file.sizeBytes) || file.sizeBytes < 0) {
    return failure("unavailable", "audio_file_unavailable");
  }
  if (file.sizeBytes > LOCAL_STT_MAX_AUDIO_BYTES) {
    return failure("failed", "audio_file_too_large");
  }

  const request: LocalSttRunRequest = {
    command,
    args: buildArgs(audioFilePath, input.language, input.engine),
    timeoutMs: normalizeTimeout(dependencies.timeoutMs)
  };
  let runResult: LocalSttRunResult;
  try {
    runResult = await (dependencies.run ?? runLocalSttProcess)(request);
  } catch {
    return failure("failed", "execution_failed");
  }
  if (runResult.status === "timeout") return failure("failed", "timeout");
  if (runResult.status === "failed") return failure("failed", "execution_failed");

  return parseOutput(runResult.stdout);
}

export function runLocalSttProcess(
  request: LocalSttRunRequest
): Promise<LocalSttRunResult> {
  return new Promise((resolve) => {
    const child = spawn(request.command, request.args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    let stdout = "";
    let settled = false;
    let timeout: NodeJS.Timeout | undefined;
    const finish = (result: LocalSttRunResult) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolve(result);
    };

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout, "utf8") > MAX_STDOUT_BYTES) {
        child.kill();
        finish({ status: "failed" });
      }
    });
    child.on("error", () => finish({ status: "failed" }));
    child.on("close", (code) => {
      finish(code === 0 ? { status: "completed", stdout } : { status: "failed" });
    });
    timeout = setTimeout(() => {
      child.kill();
      finish({ status: "timeout" });
    }, request.timeoutMs);
  });
}

async function inspectLocalFile(audioFilePath: string) {
  const file = await stat(audioFilePath);
  return { isFile: file.isFile(), sizeBytes: file.size };
}

function isSafeLocalPath(audioFilePath: string, platform: NodeJS.Platform) {
  if (audioFilePath.includes("\0") || /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(audioFilePath)) {
    return false;
  }
  if (platform === "win32") {
    return path.win32.isAbsolute(audioFilePath) &&
      !audioFilePath.startsWith("\\\\") &&
      !audioFilePath.startsWith("//");
  }
  return path.posix.isAbsolute(audioFilePath);
}

function validOption(value?: string) {
  return value === undefined || (value.length <= 32 && optionPattern.test(value));
}

function buildArgs(audioFilePath: string, language?: string, engine?: string) {
  return [
    audioFilePath,
    ...(language ? ["--language", language] : []),
    ...(engine ? ["--engine", engine] : [])
  ];
}

function normalizeTimeout(timeoutMs?: number) {
  if (!Number.isSafeInteger(timeoutMs) || !timeoutMs || timeoutMs < 100) {
    return LOCAL_STT_DEFAULT_TIMEOUT_MS;
  }
  return Math.min(timeoutMs, 120_000);
}

function parseOutput(stdout: string): LocalSttResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return failure("failed", "malformed_output");
  }
  if (!isRecord(parsed) || typeof parsed.transcript !== "string") {
    return failure("failed", "malformed_output");
  }
  const transcript = parsed.transcript.trim();
  if (!transcript) return failure("failed", "empty_transcript");

  const validated = outputSchema.safeParse({ ...parsed, transcript });
  if (!validated.success) return failure("failed", "malformed_output");
  return {
    status: "transcribed",
    provider: "local_prototype",
    transcript: validated.data.transcript,
    ...(validated.data.language ? { language: validated.data.language } : {}),
    ...(validated.data.durationMs === undefined
      ? {}
      : { durationMs: validated.data.durationMs })
  };
}

function failure(
  status: "unavailable" | "failed",
  errorCode: LocalSttErrorCode
): LocalSttResult {
  return { status, provider: "local_prototype", errorCode };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
