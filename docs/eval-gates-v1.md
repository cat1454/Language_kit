# Eval Gates v1

These gates are deterministic and model-free. They describe readiness; they do
not benchmark, train, fine-tune, download, serve, or integrate a model.

## Required Gates

1. Manifest and documentation:

   ```text
   corepack pnpm model:readiness
   ```

2. Contract and export regression set:

   ```text
   corepack pnpm eval:v0
   ```

3. Real-session evidence check:

   ```text
   corepack pnpm dogfood:check
   ```

4. Repository regression gates:

   ```text
   corepack pnpm check
   corepack pnpm test:coverage
   corepack pnpm build
   ```

## Pass Conditions

- Manifest schema and vocabulary validate.
- Known dataset kinds have an intended use and readiness status.
- `user_id`, audio paths, and secrets are absent before training review.
- Contract-backed accepted targets pass the current Zod contract.
- Rejected repair seeds retain raw response and rejection reason metadata.
- Dogfood logs remain diagnostic, manually reviewed, and excluded from
  automatic dataset construction.
- Manual review remains required before training.
- The held-out regression set does not include training rows.

`dogfood:check` proves that real evidence exists and reruns `eval:v0`; it does
not make dogfood logs safe training data. Dataset candidates still require
privacy, license/source, leakage, formatting, and human review.

No model was trained, fine-tuned, served, or downloaded by Prompt 11. All AI
output remains untrusted until validated. Production local-model work requires
a separate prompt.
