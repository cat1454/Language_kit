import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  transcribeWithLocalSttPrototype,
  type LocalSttDependencies,
  type LocalSttRunResult
} from "@/src/lib/local-stt-prototype";

const audioFilePath = path.resolve("tmp", "speaking-sample.wav");
const command = path.resolve("tools", "local-stt-secret.exe");
const enabledEnvironment = {
  LANGUAGE_KIT_LOCAL_STT_ENABLED: "1",
  LANGUAGE_KIT_LOCAL_STT_COMMAND: command
};

describe("local STT prototype", () => {
  it("is disabled by default without inspecting or running audio", async () => {
    const inspectFile = vi.fn();
    const run = vi.fn();

    await expect(transcribeWithLocalSttPrototype(validInput(), {
      environment: {},
      inspectFile,
      run
    })).resolves.toEqual({
      status: "unavailable",
      provider: "local_prototype",
      errorCode: "disabled"
    });
    expect(inspectFile).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("returns unavailable when the developer command is missing", async () => {
    await expect(transcribeWithLocalSttPrototype(validInput(), dependencies({
      environment: { LANGUAGE_KIT_LOCAL_STT_ENABLED: "1" }
    }))).resolves.toEqual({
      status: "unavailable",
      provider: "local_prototype",
      errorCode: "command_unavailable"
    });
  });

  it.each([
    ["", "missing_audio_path"],
    ["relative/audio.wav", "invalid_audio_path"],
    ["https://example.com/audio.wav", "invalid_audio_path"]
  ])("rejects unsafe audio path %j", async (candidate, errorCode) => {
    const result = await transcribeWithLocalSttPrototype({
      ...validInput(),
      audioFilePath: candidate
    }, dependencies());

    expect(result).toEqual({ status: "failed", provider: "local_prototype", errorCode });
  });

  it("requires explicit consent", async () => {
    const result = await transcribeWithLocalSttPrototype({
      ...validInput(),
      consentConfirmed: false
    }, dependencies());

    expect(result).toEqual({
      status: "failed",
      provider: "local_prototype",
      errorCode: "consent_required"
    });
  });

  it("passes safe arguments to a mock runner and parses strict JSON", async () => {
    const run = vi.fn(async (): Promise<LocalSttRunResult> => ({
      status: "completed",
      stdout: JSON.stringify({
        transcript: "  Could we reschedule for Friday?  ",
        language: "en",
        durationMs: 1234
      })
    }));

    const result = await transcribeWithLocalSttPrototype(validInput(), dependencies({ run }));

    expect(result).toEqual({
      status: "transcribed",
      provider: "local_prototype",
      transcript: "Could we reschedule for Friday?",
      language: "en",
      durationMs: 1234
    });
    expect(run).toHaveBeenCalledWith({
      command,
      args: [audioFilePath, "--language", "en", "--engine", "faster-whisper"],
      timeoutMs: 30_000
    });
  });

  it.each([
    ["not-json", "malformed_output"],
    [JSON.stringify({ transcript: "   " }), "empty_transcript"],
    [JSON.stringify({ transcript: "Hello", extra: true }), "malformed_output"]
  ])("rejects unsafe runner output", async (stdout, errorCode) => {
    const result = await transcribeWithLocalSttPrototype(validInput(), dependencies({
      run: async () => ({ status: "completed", stdout })
    }));

    expect(result).toEqual({ status: "failed", provider: "local_prototype", errorCode });
  });

  it.each([
    ["timeout", "timeout"],
    ["failed", "execution_failed"]
  ] as const)("normalizes runner %s without leaking details", async (status, errorCode) => {
    const result = await transcribeWithLocalSttPrototype(validInput(), dependencies({
      run: async () => ({ status })
    }));

    expect(result).toEqual({ status: "failed", provider: "local_prototype", errorCode });
    expect(JSON.stringify(result)).not.toContain(command);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("redacts a rejected runner error", async () => {
    const result = await transcribeWithLocalSttPrototype(validInput(), dependencies({
      run: async () => {
        throw new Error(`failed command ${command} with token secret-token`);
      }
    }));

    expect(result).toEqual({
      status: "failed",
      provider: "local_prototype",
      errorCode: "execution_failed"
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
    expect(JSON.stringify(result)).not.toContain(command);
  });

  it("rejects unsupported extensions and oversized files before execution", async () => {
    const run = vi.fn();
    const unsupported = await transcribeWithLocalSttPrototype({
      ...validInput(),
      audioFilePath: path.resolve("tmp", "speaking-sample.txt")
    }, dependencies({ run }));
    const oversized = await transcribeWithLocalSttPrototype(validInput(), dependencies({
      inspectFile: async () => ({ isFile: true, sizeBytes: 25 * 1024 * 1024 + 1 }),
      run
    }));

    expect(unsupported).toEqual({
      status: "failed",
      provider: "local_prototype",
      errorCode: "unsupported_audio_type"
    });
    expect(oversized).toEqual({
      status: "failed",
      provider: "local_prototype",
      errorCode: "audio_file_too_large"
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("returns unavailable when the local file cannot be inspected", async () => {
    const result = await transcribeWithLocalSttPrototype(validInput(), dependencies({
      inspectFile: async () => {
        throw new Error("missing file");
      }
    }));

    expect(result).toEqual({
      status: "unavailable",
      provider: "local_prototype",
      errorCode: "audio_file_unavailable"
    });
  });
});

function validInput() {
  return {
    audioFilePath,
    language: "en",
    engine: "faster-whisper",
    consentConfirmed: true
  };
}

function dependencies(overrides: Partial<LocalSttDependencies> = {}): LocalSttDependencies {
  return {
    environment: enabledEnvironment,
    inspectFile: async () => ({ isFile: true, sizeBytes: 1024 }),
    run: async () => ({ status: "failed" }),
    ...overrides
  };
}
