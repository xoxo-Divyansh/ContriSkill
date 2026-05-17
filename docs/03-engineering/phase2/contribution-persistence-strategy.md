# Contribution Persistence Strategy

## Objective

Move contribution workflows from in-memory orchestration to reliable DB-backed persistence while preserving existing clean architecture boundaries.

## Current Implemented Baseline

- Contribution domain rules and lifecycle exist in `packages/domain`.
- Contribution application service + API integration are implemented in API workspace.
- Runtime contribution repositories are currently in-memory.

## Target Direction (Phase 2)

1. Keep application services unchanged at call-site level.
2. Introduce DB-backed repository implementations for:
   - contribution posts
   - applications
   - collaborations
   - contribution event store (append-only)
3. Use dependency injection to swap repository implementation by runtime configuration.

## Repository Implementation Strategy

- `ContributionRepository` remains the contract boundary.
- Create separate infrastructure adapters:
  - `DbContributionRepository`
  - `DbContributionEventRepository`
- Keep mapping logic explicit (`row -> domain type`, `domain input -> SQL params`).
- Do not move domain validation into repository layer.

## Transactional Consistency

- Use service-level unit-of-work for multi-write operations:
  - accept application -> update post state + create collaboration + append events
- Require single transaction for state-changing workflows with more than one write.
- Guarantee:
  - all writes commit together, or
  - no writes are committed.

## Event Persistence Strategy

- Persist domain events in append-only contribution event table.
- Event IDs are immutable and unique.
- Events include:
  - aggregate type/id
  - actor id (when available)
  - event type
  - payload
  - occurred timestamp
- Event append happens in same DB transaction as state mutation for causal integrity.

## Concurrency Strategy

### Default Recommendation

- Start with optimistic concurrency (version/timestamp guard on updates).
- Reject stale updates with conflict error.

### Why

- Lower lock contention.
- Better fit for modular monolith MVP scale.
- Easier to observe and evolve before introducing lock-heavy workflows.

### When to Use Pessimistic Controls

- Critical acceptance/settlement paths if contention rises.
- Moderator-enforced workflows requiring strict serialization.

## MVP vs Evolution

### MVP/near-term

- DB repositories for posts/applications/collaborations/events.
- Transactional orchestration for multi-write transitions.
- Conflict-safe optimistic checks.

### Deferred

- Full event sourcing rebuild flow.
- Cross-service distributed transaction coordination.

## OPEN_DECISION

1. Choose optimistic guard primitive: `updated_at` vs integer `version`.
2. Define strict idempotency key scope for transition endpoints.
3. Decide retention/index strategy for high-volume event payload columns.
