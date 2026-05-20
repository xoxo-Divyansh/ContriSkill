# Collaborative Mutation Foundation Implementation Checklist

## Purpose

Sprint-ready execution checklist for implementing collaborative mutation infrastructure after planning sign-off.

## Phase 0 - Preconditions

### Tasks

- Validate realtime transport/auth/subscription foundations are stable.
- Confirm contribution domain/application services own mutation business rules.
- Confirm presence + observability baseline remains healthy in CI/runtime smoke checks.
- Confirm route/API capability guards are centrally enforceable.

### Done Criteria

- Realtime foundation CI is green.
- Auth/session/capability layers are active for mutation surfaces.
- Known OPEN_DECISION items with blocking impact are resolved or explicitly deferred.

### Likely Files (Future Runtime Phase)

- `apps/api/src/realtime/*`
- `apps/api/src/modules/*`
- `packages/domain/src/*`
- `apps/web/src/providers/*`

### DO NOT IMPLEMENT YET

- CRDT/OT merging.
- Collaborative editing text model.
- Notifications/chat/activity features.

## Phase 1 - Shared Mutation Contracts

### Tasks

- Define mutation envelope and acknowledgement contracts in shared contracts package.
- Define mutation status/response codes and conflict taxonomy.
- Add payload schemas for first MVP mutation types.

### Done Criteria

- Contract package exports mutation types cleanly.
- API + web compile against shared mutation contracts.
- Contract tests cover schema and status mappings.

## Phase 2 - Backend Mutation Intake Boundary

### Tasks

- Add mutation intake endpoint/controller boundary.
- Add envelope validation and actor binding.
- Add capability + ownership gating before service execution.
- Add idempotency handling skeleton.

### Done Criteria

- Thin controller; service orchestration remains central.
- Unauthorized/invalid mutations are rejected with typed contract-safe errors.
- No direct DB logic in realtime transport.

## Phase 3 - Frontend Mutation Queue

### Tasks

- Add queue model for pending mutations.
- Add optimistic apply/rollback scaffolding.
- Add mutation status lifecycle state.
- Integrate queue with existing API client/provider boundaries.

### Done Criteria

- Pending mutations visible to app-level flow.
- Optimistic updates can rollback deterministically.
- Queue logic isolated from presentation primitives.

## Phase 4 - Optimistic Acknowledgement Flow

### Tasks

- Process `accepted`/`rejected`/`conflict` acknowledgements.
- Reconcile queue entries with realtime authoritative events.
- Add retry logic for transport failures only.

### Done Criteria

- Accepted mutations finalize local state cleanly.
- Rejected/conflict mutations rollback or transition to recovery state.
- Duplicate acknowledgements/events are idempotently handled.

## Phase 5 - Conflict Detection MVP

### Tasks

- Implement stale-base and invalid-state conflict detection.
- Implement ownership/capability conflict handling.
- Add same-field conflict response strategy (non-CRDT).

### Done Criteria

- Conflict responses include stable conflict codes.
- Client receives actionable recovery metadata.
- Conflict handling does not bypass domain rules.

## Phase 6 - Tests and Observability

### Tasks

- Add mutation queue and reconciliation tests.
- Add backend idempotency/conflict/authorization tests.
- Add mutation diagnostics counters/logging and debug visibility.
- Add reconnect/replay mutation recovery tests.

### Done Criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run ci` pass.
- Mutation diagnostics are available in non-production runtime diagnostics surfaces.
- Replay/duplicate/stale conflict paths are covered by tests.

## Validation Commands (Future Runtime Phases)

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run ci`

## DO NOT IMPLEMENT YET (Explicit)

- CRDT/OT algorithms.
- Rich collaborative editors.
- Comments/chat/messaging.
- Notification/event-delivery systems.
- AI conflict resolution.
- Activity feeds/ranking integration.

## OPEN_DECISION

1. Mutation idempotency persistence model and TTL.
2. Queue persistence strategy for frontend restart recovery.
3. First conflict UX pattern (inline rebase prompt vs explicit refresh-and-retry flow).
4. Whether mutation acknowledgement should also be delivered over realtime channel in MVP, or HTTP response only.
