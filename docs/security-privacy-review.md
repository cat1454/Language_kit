# Security And Privacy Review

This review covers the local single-user MVP at Prompt 12. It documents current
boundaries and residual risks; it is not a production security certification.

## Trust Model

- The application owns workflow, validation, storage, and learner-safe output.
- AI output is untrusted until the existing Zod contract accepts it.
- Manual AI relay is the default; no provider integration is trusted implicitly.
- PostgreSQL, browser demo data, backups, exports, and dogfood logs are local
  operator-controlled data surfaces.

## user_id Boundary

`user_id = 1` is an internal single-user placeholder. It is used by repository
queries but is not authentication, authorization, or tenant isolation. Explicit
API projections omit `user_id`, including lesson detail, review queue, and
speaking-attempt responses.

Release implication: do not expose this app to multiple untrusted users. Real
auth and multi-user isolation require a separate migration and threat review.

## Lesson Detail Safety

The lesson detail route validates the lesson ID and returns an explicit shape.
It does not spread raw database rows, and existing regression tests verify that
`user_id` is absent.

The route returns the accepted lesson, saved prompt/raw model output, practice
history, and the existing Listening audio path required for playback. Raw model
output and learner history may be sensitive; local access is therefore trusted.
Listening audio path behavior is limited to the validated lesson path and
normalized variant metadata already covered by safety tests.

The full listening transcript remains governed by the learner-flow gate and
must not be revealed before listening checks complete.

## Review Queue Safety

The review repository filters the single-user placeholder internally and selects
only compact action fields. The queue excludes `user_id`, audio path values, raw
database rows, and raw model output. Evidence snippets are normalized and capped.
Unknown, duplicate, malformed, or oversized query values return HTTP 400.

## Speaking Attempt Safety

- The API accepts a strict JSON shape and a bounded manual transcript.
- The learner response omits `user_id` and audio path fields.
- Speaking audio remains a browser page-session Blob URL.
- No speaking audio is uploaded, persisted, exported, or assigned an
  `audio_path` by the current flow.
- Microphone access occurs only after the learner explicitly clicks record.

The nullable database audio path is reserved for a future approved design and
must remain unused in this release.

## Local STT Boundary

The local STT prototype is disabled by default and disconnected from learner UI
and API routes. It performs no network request or database write, bundles no
model, and requires explicit developer configuration plus consent. Production
local STT needs a separate installation, sandboxing, retention, consent,
performance, failure-recovery, privacy, and security plan.

## Raw Model Output

Lesson and feedback workflows persist raw model output for rejection analysis,
repair, and later export review. This can include personal or confidential text
copied into prompts. Validation makes structure safe; it does not make content
non-sensitive.

- Do not put credentials, private messages, or unnecessary identifiers in prompts.
- Keep the local database and backups access-controlled.
- Review raw output manually before sharing or dataset use.
- Never treat rejected rows as approved targets merely because JSON parses.

## Exports

Current exports omit `user_id` and audio paths. They may still contain prompts,
raw responses, learner evidence, corrections, and metadata. Before any export
leaves the trusted machine, review privacy, secrets, source/license provenance,
accepted/rejected separation, deduplication, and train/eval leakage.

No export is automatically uploaded, trained on, or approved for fine-tuning.

## Dogfood Privacy Boundary

Checked-in dogfood evidence is diagnostic and should contain minimal session
metadata, not secrets or unnecessary learner content. Raw dogfood logs are never
automatic dataset input. Any log containing personal evidence must remain local
or be redacted before commit or sharing.

`dogfood:check` proves that real evidence exists and eval v0 passes; it does not
prove the log is anonymous or training-safe.

## Backup And Environment Safety

- `.env` is ignored; `.env.example` contains only local development defaults.
- Provider credentials are neither required nor documented as a default path.
- Backups are ignored, local, and should be treated as personal data.
- Restore verification uses a disposable database, never the active DB first.
- Cloud upload and backup encryption are not included.

## Validation And Error Handling

- `lesson_pack.v1` and `feedback.v1` remain strict and unchanged.
- Request bodies are parsed as JSON and validated before repository calls.
- Speaking requests reject unknown fields; review queries reject unknown and
  duplicate parameters.
- Repository errors return stable messages while detailed errors stay server-side.
- No Zod validation was relaxed for Prompt 12.

## Model And Training Boundary

Prompt 12 performs no training, fine-tuning, model serving, weight download,
provider integration, vector search, or automatic dataset upload. Model readiness
checks are deterministic documentation and schema gates only.

## Residual Risks And Release Decision

Known local-MVP risks:

- no production authentication, authorization, CSRF posture, or rate limiting
- raw learner/model text stored unencrypted in the local database
- local backups depend on operator filesystem security and retention discipline
- browser demo data can persist until browser storage is cleared
- no production monitoring, incident response, or automated secret scanner

These risks are acceptable only for the documented local single-user MVP. They
block production hosting or shared untrusted access without a separately approved
hardening stage.

Prompt 12 found no release-blocking regression in the existing learner-facing
API safety boundary. Runtime payloads, contracts, tables, and migrations remain
unchanged.
