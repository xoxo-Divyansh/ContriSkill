# Optimistic Reconciliation

## Objective

Define MVP-safe optimistic mutation behavior that keeps UX responsive while preserving server-authoritative correctness.

## Optimistic Apply Flow

1. Frontend enqueues mutation with `pending` state.
2. Frontend applies bounded optimistic projection to local view model.
3. Mutation is sent to backend intake boundary.
4. Mutation remains `pending` until acknowledgement or timeout.

## Server Acknowledgement Flow

- `accepted`:
  - mark mutation `acknowledged`
  - align local entity version/state with acknowledged result
  - clear rollback marker
- `conflict`:
  - mark mutation `conflict`
  - rollback optimistic projection or apply server-suggested corrected state
- `rejected`:
  - mark mutation `rejected`
  - rollback optimistic projection
  - surface safe user-facing error

## Rollback Flow

- Each optimistic projection stores reversible diff/snapshot boundary.
- Rollback is deterministic and local-only.
- Rollback never mutates server state directly; it only updates client local representation.

## Retry Flow

- Retry only for network/transport-level failures.
- Do not auto-retry `conflict` or `authorization` failures.
- Retries retain same `mutationId` to preserve idempotency semantics.
- Exponential backoff with bounded attempts for MVP.

## Duplicate Mutation Handling

- Frontend prevents duplicate queue insertion for same `mutationId`.
- Backend idempotency ensures safe duplicate acknowledgement.
- Realtime echo events matching already-acknowledged mutation should be treated as no-op reconcile.

## Stale Mutation Handling

- If backend reports stale base/version conflict:
  - mark mutation as `conflict`
  - fetch latest entity snapshot via query API
  - rebase user intent only if still semantically valid

## Reconciliation with Realtime Events

- Realtime events remain authoritative for cross-session changes.
- Local optimistic state must reconcile against authoritative event version.
- If authoritative event diverges from optimistic local view, apply deterministic correction path.

## OPEN_DECISION

1. Should rollback strategy use full snapshot replacement or field-level diff inversion?
2. Should client auto-rebase simple stale updates in MVP, or always require explicit user retry?
3. Should mutation timeout transition to `retryable_error` automatically or stay `pending` with manual user action?
