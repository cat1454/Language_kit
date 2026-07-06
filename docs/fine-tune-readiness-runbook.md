# Fine-Tune Readiness Runbook

This is a review checklist for a possible future prompt. Prompt 11 performs no
training, fine-tuning, model serving, provider integration, model download, or
dataset upload.

No model was trained. No model was fine-tuned. No model was served. No model
weights were downloaded. No provider was integrated. Dataset entries are
candidates only, and manual review is required before any training run.

## Stop Conditions

Stop the review if any candidate contains `user_id`, an audio path, a secret,
unreviewed private learner content, unknown licensing, or undocumented source
material. Do not copy raw dogfood logs into a training set. Do not connect the
disabled local STT prototype to this workflow.

AI output remains untrusted until the existing Zod contract validates it. A
manifest status is not permission to train.

## Conservative Placeholder Thresholds

These are planning placeholders, not evidence that training is ready:

- at least 1,000 manually reviewed SFT pairs for a narrow task
- at least 500 manually reviewed repair pairs with both broken and corrected
  responses
- at least 100 held-out eval cases per critical task or failure class
- no duplicate or near-duplicate item may cross a train/eval boundary

A future approved prompt must replace or justify these thresholds using the
chosen model, task breadth, data quality, and measured learning curve.

## Readiness Checklist

- [ ] Dataset size meets an approved task-specific threshold.
- [ ] Every file is valid one-object-per-line JSONL when JSONL is required.
- [ ] Every contract-backed target passes the current Zod contract.
- [ ] Accepted and rejected rows are separated for their intended use.
- [ ] Every rejected repair seed has `raw_response` and `rejection_reason`.
- [ ] Every repair training pair has a manually reviewed corrected target.
- [ ] Privacy review confirms no `user_id`, audio path, secret, or unapproved
  private learner content.
- [ ] License and source review is complete for every row.
- [ ] A deterministic train/validation/eval split plan is documented.
- [ ] Leakage and duplicate checks cover prompts, responses, lessons, and
  learner-derived text.
- [ ] Prompt/response formatting is consistent and versioned.
- [ ] Regression gates include `eval:v0`, `dogfood:check`, contract tests, and
  a task-specific held-out eval.
- [ ] A rollback plan names the pre-model behavior and disable switch.
- [ ] The model card is complete.
- [ ] Hardware, memory, storage, runtime, latency, and cost are estimated.
- [ ] Safety review covers prompt injection, unsafe output, privacy, and
  retention.
- [ ] A human reviewer explicitly approves scope before any training run.

## Future Run Evidence

If a separate prompt later authorizes training, record immutable dataset and
code revisions, split hashes, model/base-model license, exact parameters,
hardware, runtime, eval results, failures, approval, and rollback outcome in the
model card. Never infer this evidence from a readiness manifest.

Production local-model work requires a separate prompt.
