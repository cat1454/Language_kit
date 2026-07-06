# Local STT Prototype Spike

Prompt 9.5 adds a disabled by default server-side boundary for evaluating a
future local speech-to-text command. It is a prototype spike, not production
STT, and it is not connected to the learner UI or any API route.

## What It Does

`src/lib/local-stt-prototype.ts` validates an existing local audio file and,
only when explicitly enabled, invokes a developer-configured executable. The
executable receives an argument array; the boundary never constructs or runs a
shell command string.

The command contract is:

```text
<command> <absolute-audio-path> [--language <value>] [--engine <value>]
```

The command must write one strict JSON object to stdout:

```json
{
  "transcript": "Could we reschedule for Friday?",
  "language": "en",
  "durationMs": 1234
}
```

Unknown output fields, malformed JSON, and empty transcripts are rejected.
Command paths, stderr, and thrown error details are never returned in the safe
result.

## Developer Configuration

The prototype requires both environment values:

```dotenv
LANGUAGE_KIT_LOCAL_STT_ENABLED=1
LANGUAGE_KIT_LOCAL_STT_COMMAND=C:\path\to\local-stt-wrapper.exe
```

`LANGUAGE_KIT_LOCAL_STT_COMMAND` must name one executable or wrapper. Do not put
shell operators, inline arguments, API keys, or credentials in it. When the
enable flag is not exactly `1`, the boundary returns `disabled`. When the flag
is enabled but the command is missing, it returns `command_unavailable`.

No model is bundled, installed, or downloaded automatically. The configured
command and any model it uses are entirely developer-managed and local.

## Safety Limits

- explicit `consentConfirmed: true` is required
- audio paths must be absolute local paths; URLs, relative paths, and Windows
  network/UNC paths are rejected
- allowed extensions are `.flac`, `.m4a`, `.mp3`, `.ogg`, `.wav`, and `.webm`
- maximum input size is 25 MiB
- default timeout is 30 seconds and the internal ceiling is 120 seconds
- stdout is limited to 64 KiB
- execution uses `spawn` with `shell: false`, an argument array, hidden Windows
  process windows, ignored stdin, and ignored stderr
- failures expose only stable error codes

This boundary performs no network call, upload, database write, or audio-file
persistence. Callers must provide an already-existing local file. The current
Speaking Prompt 9 browser recording remains a page-session Blob URL and is not
sent to this boundary.

## Tests And Current Wiring

Unit tests inject deterministic file inspectors and process runners. They do
not execute or require a real STT model. The learner UI, speaking-attempt API,
manual transcript flow, database schema, and exports are unchanged.

No `stt:local:probe` package script was added. Running the TypeScript boundary
directly from Node would require a new runtime transpiler or duplicated script
logic, neither of which is justified for this spike. A future approved runtime
can call the module from an existing server-side TypeScript surface.

## Production Decisions Still Required

Productionizing local STT requires a separate plan and approval for:

- model and engine choice
- installation and runtime documentation
- supported devices, CPU/GPU/RAM, and disk requirements
- audio and transcript retention/deletion policy
- explicit learner consent UX
- failure and recovery behavior
- process sandboxing and security review
- representative latency and resource benchmarks
- end-to-end privacy review

Until those decisions are complete, local STT must remain disabled and absent
from the learner UI.
