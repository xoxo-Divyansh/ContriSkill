# Realtime Event Contracts

## Objective

Define consistent, typed, and versionable event contracts for realtime delivery aligned with contribution and auth/session architecture.

## Event Naming Convention

- Format: `<domain>.<entity>.<action>.v<version>`
- Examples:
  - `contribution.post.created.v1`
  - `contribution.post.state_changed.v1`
  - `contribution.application.submitted.v1`
  - `session.actor.revoked.v1`

## Event Envelope (Canonical)

- `eventId`: globally unique id.
- `eventName`: versioned event name.
- `occurredAt`: ISO timestamp.
- `actorId`: actor that caused event (or `system`).
- `scope`: `{ type: "actor" | "contribution", id: string }`.
- `sequence`: monotonic sequence within scope.
- `cursor`: replay cursor token.
- `payload`: event-specific typed object.

## Event Categories

1. Contribution Lifecycle Events
   - post created/updated/archived/state changed.
   - application submitted/withdrawn/accepted/rejected.
2. Session/Auth Events
   - actor session revoked/rotated (scope-limited).
3. Presence Events (best-effort)
   - actor joined/left contribution room.
4. System Events (operational)
   - transport degraded/reconnected (client diagnostic only).

## Subscription Model

- Actor stream subscription:
  - receives actor-scoped events only.
- Contribution stream subscription:
  - requires contribution read capability and room access.
- No wildcard global subscriptions in MVP.

## Broadcast Boundaries

- Publish only after persistence/transaction commit.
- Never emit sensitive credentials/session secrets.
- Never emit moderation-sensitive internals to non-privileged actors.

## Versioning Strategy

- Use additive payload evolution where possible.
- Breaking changes require new event version suffix (`v2`).
- Maintain dual-version publish window during client migration.

## Error/Conflict Handling

- Invalid subscription -> authorization error event + server reject.
- Unknown cursor -> explicit replay-reset instruction.
- Version mismatch -> server sends unsupported-version error with fallback guidance.

## MVP vs Deferred

### MVP

- Contribution and session events needed for active surfaces.
- Single envelope schema.
- Cursor replay for short retention window.

### Deferred

- Bulk historical replay APIs.
- Cross-domain aggregation streams.
- Fine-grained per-field diff events.

## OPEN_DECISION

1. Cursor format: opaque ULID checkpoint vs signed structured payload.
2. Sequence source: per-channel DB sequence vs generated logical clock.
3. Required dual-version support duration during contract upgrades.
