# WebSocket Architecture

## Objective

Define a production-ready realtime transport architecture that integrates with existing auth/session/contribution systems while preserving modular boundaries.

## Lifecycle

1. Client initiates connection with session-bound auth proof.
2. Server validates session + actor + capabilities.
3. Connection is registered to actor-scoped channels.
4. Client subscribes to allowed topics/rooms.
5. Server emits persisted domain-derived events.
6. Heartbeats maintain liveness.
7. Disconnect triggers cleanup and presence expiration.

## Transport Abstraction

- Define a transport interface independent of socket library:
  - `connect`
  - `subscribe`
  - `unsubscribe`
  - `publish`
  - `disconnect`
- Keep business event logic outside transport handlers.
- Permit future transport adapters (SSE/internal bus) without domain changes.

## Server Responsibilities

- Authenticate and authorize connection/subscriptions.
- Enforce capability-based access for each channel.
- Maintain connection + subscription registry.
- Broadcast only contract-safe payloads.
- Expose structured runtime metrics and errors.

## Client Responsibilities

- Maintain connection state machine.
- Subscribe only to required scopes.
- Handle reconnect with cursor replay.
- Resolve event ordering with server sequence metadata.
- Fallback to API polling when disconnected.

## Connection Boundaries

- Personal actor channel: self session/account-bound events.
- Contribution room channel: events scoped to a contribution and authorized actors.
- Privileged channels: moderator/admin-only (deferred unless required).

## Scaling Concerns

- Single-node runtime acceptable for MVP.
- Ensure stateless auth validation per connection.
- Plan registry abstraction for future distributed coordination.
- Prepare for external pub/sub when multi-instance rollout begins.

## Future Compatibility

- Event envelope includes version, id, timestamp, and cursor.
- Channel naming stable and typed.
- Gateway logic isolated from contribution domain services.

## MVP vs Deferred

### MVP

- Single realtime gateway process.
- Actor + contribution channels.
- Reconnect with bounded replay.

### Deferred

- Multi-region fanout.
- Advanced room sharding.
- Stateful collaborative edit sessions.

## OPEN_DECISION

1. Should auth proof be cookie-only or bearer token-compatible for non-browser clients?
2. How strict should per-connection subscription limits be at MVP launch?
3. Do we require ordered delivery guarantees within a channel for MVP?
