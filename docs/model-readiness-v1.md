# Model Readiness v1

Prompt 11 adds deterministic readiness definitions and documentation. It does
not run or integrate a model.

## Prompt 11 Boundary

- No model was trained.
- No model was fine-tuned.
- No model was served.
- No model weights were downloaded.
- No AI provider was integrated.
- No dataset was uploaded.
- The local STT prototype remains separate, disabled by default, and absent
  from learner UI and API routes.

Production local-model work requires a separate prompt. All AI output remains
untrusted until the existing Zod contracts validate it.

## Dataset Classification

`datasets/manifest.example.json` is an example inventory, not a dataset dump or
training approval. Its statuses mean:

- `blocked`: a known safety, quality, pairing, or format gate is incomplete.
- `needs_review`: structurally useful, but privacy, source, license, content,
  or accepted-row review remains.
- `ready_for_eval`: usable by a deterministic model-free evaluation check.
- `ready_for_training_review`: all machine-checkable gates pass, but a human
  must still approve any later training proposal.

Privacy flags are conservative. Free-form prompts, learner evidence, feedback,
and raw responses may contain personal data even when database identifiers are
absent. `noSecrets: false` means a manual secret scan is still required; it does
not claim that a secret was found.

## Existing Source Inspection

| Kind | Intended use | Current readiness | Reason |
|---|---|---|---|
| `lesson_generation_sft` | SFT candidate | needs review | accepted `lesson_pack.v1` rows, but prompts and raw responses need privacy/source review |
| `feedback_scoring_sft` | SFT candidate | needs review | accepted and rejected rows are mixed and must be separated for a training proposal |
| `error_classification` | SFT candidate | blocked | useful label pairs, but no explicit accepted field and learner evidence may be private |
| `retry_generation_sft` | SFT candidate | needs review | paired evidence/correction/drill rows lack explicit accepted metadata |
| `json_repair_sft` | repair seed | blocked | rejected raw response and reason exist, but `repaired_json` is currently `null` |
| `eval_set_v0` | eval candidate | ready for eval | checked-in deterministic fixtures with no model calls |
| `dogfood_sessions` | diagnostic only | blocked | logs may contain private learner evidence and are never automatic training input |

The export rows do not include `user_id` or audio paths. Prompt 11 does not
change export builders, learner-facing APIs, database tables, `lesson_pack.v1`,
`feedback.v1`, or manual feedback validation.

## Deterministic Check

Run:

```text
corepack pnpm model:readiness
```

The check validates the example manifest vocabulary, privacy gates, repair-seed
policy, model-card fields, and readiness documentation. It performs no network
request, model call, training, fine-tuning, serving, or weight download.

Datasets are candidates only. Manual review is required before training.
