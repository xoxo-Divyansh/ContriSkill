# Frontend Mutation Flow

## Objective

Define frontend mutation orchestration that stays compatible with current provider architecture, API client boundaries, and realtime synchronization model.

## Mutation Queue Model

Each queued item tracks:

- `mutationId`
- `target entity`
- `mutation type`
- `payload`
- `status` (`pending`, `acknowledged`, `rejected`, `conflict`, `retryable_error`)
- `attempt count`
- `optimistic patch reference`

## Pending Mutation State

- Mutations enter `pending` immediately after local enqueue.
- Pending state should be visible to route-level components for UX cues.
- Pending mutations are ordered FIFO per entity scope for MVP.

## Optimistic UI Boundaries

- Allowed:
  - local contribution metadata updates
  - local state transition badges
  - local application submission status hints
- Not allowed:
  - trust/reputation score optimistic changes
  - moderation outcomes
  - cross-entity derived aggregates

## Reconciliation with Realtime Events

- On incoming realtime event:
  - match by entity scope/version and optional mutation correlation id (future-ready)
  - finalize or correct optimistic queue entries
- If authoritative event contradicts local optimistic state, local state is corrected to server-authoritative representation.

## Reconnect Behavior

- Queue persists through transient reconnect.
- On reconnect:
  - restore subscriptions
  - fetch latest query snapshots for active scopes
  - reconcile pending queue against latest server state
- Timed-out pending entries transition to `retryable_error` with controlled retry UX.

## Error Handling Direction

- Capability/ownership errors: immediate terminal rejection.
- Conflict errors: transition to conflict state and present recoverable path.
- Network errors: bounded auto retry before surfacing manual retry.

## Integration Boundaries

- Keep mutation queue logic in frontend application layer utilities/hooks.
- UI primitives remain presentation-only.
- API clients remain transport/contract wrappers, not queue orchestrators.

## OPEN_DECISION

1. Queue persistence medium: memory-only vs sessionStorage/localStorage for MVP.
2. Should queue ordering be global FIFO or entity-scoped FIFO with parallel lanes?
3. How to expose conflict-recovery UI in MVP without introducing heavy workflow complexity?
