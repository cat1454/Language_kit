# Infrastructure Debt

This tracker keeps small safety and infrastructure tasks attached to nearby future work.

Do not create future `X.5` prompts for every small task. Use an `X.5` prompt only when the work has real migration, data-safety, or architecture risk. Otherwise, add the item here and attach it to the nearest relevant future prompt.

## Open Items

- Cloud backup automation later, after local backup and restore are proven.
- Backup encryption later, before backups leave a trusted local machine.
- CI/CD later, before team collaboration or hosted deployment.
- Auth/user migration later, when moving beyond the single-user placeholder.
- Observability/logging later, before production or multi-learner use.
- Speaking-audio retention and deletion controls before any recording is
  persisted beyond the current browser page session.
- Local STT production plan covering model/runtime installation, supported
  devices, process sandboxing, performance benchmarks, consent UX, failure
  recovery, security review, and privacy review.
- Adaptive review v2 research only when product evidence justifies spaced
  repetition, due dates, notifications, vector memory, or personalized
  scheduling.
