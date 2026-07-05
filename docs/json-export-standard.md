# JSON Export Standard

Use this checklist before declaring an export ready for evaluation or fine-tuning.

- Accepted or rejected status must be explicit.
- Source, task, and version metadata must be filterable.
- Rejected rows must include `raw_output` or `raw_response` and `rejection_reason`.
- Do not export misleading null training targets.
- JSONL must be valid one-object-per-line.
- Every new export needs unit or integration coverage.
- Manually inspect 5-10 rows before declaring the export ready.
