# Event Architecture

## Objective

Establish a reliable event model that preserves trust-critical auditability and supports future async workflows without overcomplicating MVP runtime.

## Event Taxonomy

## 1) Domain Events

- Emitted from application-service workflows.
- Represent business facts (post created, application accepted, state changed).
- Stored append-only for traceability.

## 2) Integration Events

- Derived from persisted domain events.
- Used for async side effects (notifications, moderation queue triggers, analytics).
- Can evolve independently from domain internals.

## Append-Only Event Strategy

- Event writes are immutable.
- Never update/delete historical event rows.
- Corrections are represented by compensating events.
- Include causal metadata (aggregate id/type, actor, timestamp, payload).

## Dispatch Flow Direction

1. Application service mutates domain state.
2. Same transaction appends domain events.
3. Outbox-style dispatcher publishes integration events asynchronously.
4. Consumers process with idempotency guarantees.

## Async Processing Boundaries

- Async consumers are for side effects only.
- Core business state transitions remain synchronous in command path.
- Event handlers must be retry-safe and idempotent.

## Retry/Failure Considerations

- Use retry with backoff for transient failures.
- Dead-letter strategy for repeated failures.
- Persist processing attempts and last error summary.
- Never silently drop trust-affecting events.

## Delivery Semantics

- At-least-once delivery for integration events.
- Consumer idempotency key requirement:
  - event id + handler name

## MVP vs Evolution

### MVP/near-term

- Domain event persistence in same transaction as writes.
- Minimal outbox dispatcher for async side effects.
- Single worker process acceptable.

### Deferred

- Dedicated event bus platform.
- Multi-consumer partitioned stream orchestration.

## OPEN_DECISION

1. Outbox polling interval and batch size defaults.
2. Exact dead-letter reprocessing policy ownership.
3. Event payload versioning strategy (inline version vs schema registry).
