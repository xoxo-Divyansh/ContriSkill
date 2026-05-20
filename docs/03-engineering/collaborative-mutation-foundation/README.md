# Collaborative Mutation Foundation (Phase 4 Planning)

## Goal

Define a safe, MVP-scoped collaborative mutation model that integrates with current ContriSkill domain services, realtime transport, presence runtime, and observability foundations.

## Scope

- Documentation and architecture planning only.
- No runtime implementation in this phase.
- Preserve existing domain -> application service -> API -> realtime boundaries.

## MVP Boundaries

### In Scope

- Shared mutation envelope contract.
- Frontend mutation queue + optimistic lifecycle model.
- Backend mutation intake and validation boundaries.
- Conflict detection model (non-CRDT, non-OT).
- Reconciliation rules with realtime events and reconnect flows.
- Mutation-specific observability and failure diagnostics.

### Out of Scope

- Collaborative text editing.
- CRDT or OT algorithms.
- Chat/comments/annotations.
- Notification workflows.
- Activity feed generation.
- AI-assisted mutation conflict resolution.

## Deferred Boundaries

- Multi-entity transaction batches from client.
- Semantic merge/conflict auto-resolution.
- Cross-room collaboration orchestration.
- Background conflict mediation workflows.
- Offline-first mutation sync with long-lived local queue durability.

## Implementation Sequencing

1. Lock shared mutation contracts and acknowledgement model.
2. Add backend mutation intake boundary + policy gates.
3. Add frontend mutation queue + optimistic state model.
4. Add acknowledgement/reconciliation loop.
5. Add conflict detection MVP responses.
6. Add observability counters/logging and recovery validations.

## Architecture Constraints

- Realtime remains a delivery channel, never source of truth.
- Domain rules remain centralized in domain/application service layers.
- No direct database mutation in websocket handlers.
- Mutation authorization remains capability-based and actor-scoped.

## OPEN_DECISION

1. Mutation id generation authority: client-generated ULID vs server-issued token.
2. Required idempotency retention window for duplicate mutation suppression.
3. Whether first MVP mutation queue should persist across browser restart or be session-memory only.
