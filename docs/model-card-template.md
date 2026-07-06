# Model Card Template

Complete this template only for a separately approved model experiment or
release. Do not mark unknown fields as complete.

## Model identity

- Name/version:
- Base model and immutable revision:
- Owner/reviewer:
- Date/status:
- License:

## Intended use

- Approved tasks:
- Users and environment:
- Out-of-scope uses:
- Disable/fallback behavior:

## Training data

- Dataset manifest revision:
- Dataset hashes and row counts:
- Accepted/rejected separation:
- Train/validation split:
- Contract versions:
- Manual review evidence:

## Evaluation

- Eval dataset revisions:
- Leakage/duplicate checks:
- Baseline and regression gates:
- Results by task and failure class:
- Known failures:

## Privacy, licensing, and sources

- Personal-data review:
- `user_id` and audio-path exclusion:
- Secret scan:
- Source provenance:
- License/consent review:
- Retention and deletion policy:

## Safety and limitations

- Untrusted-output validation:
- Misuse and prompt-injection review:
- Bias/coverage limitations:
- Human oversight:
- Local STT separation:

## Runtime and hardware estimate

- Hardware and memory:
- Storage:
- Expected latency/throughput:
- Runtime dependencies:
- Offline/network assumptions:

## Rollback plan

- Pre-model behavior:
- Disable switch:
- Rollback owner and procedure:
- Rollback verification:

## Human approval

- Data reviewer/sign-off:
- Safety reviewer/sign-off:
- Product owner/sign-off:
- Approval date and scope:

No model was trained or fine-tuned by Prompt 11. Manual review is required
before training, and production local-model work requires a separate prompt.
