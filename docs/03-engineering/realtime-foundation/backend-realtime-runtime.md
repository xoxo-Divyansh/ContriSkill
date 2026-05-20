# Backend Realtime Runtime

## Objective

Define backend runtime layering for realtime delivery without coupling transport mechanics to domain and application-service logic.

## Runtime Layering

1. **Transport Layer**
   - socket protocol handling
   - handshake/connect/disconnect
2. **Auth/Policy Layer**
   - session resolution
   - capability + subscription authorization
3. **Registry Layer**
   - connection registry
   - subscription registry
4. **Broadcast Layer**
   - domain/integration event to channel mapping
5. **Observability Layer**
   - metrics/logging/error tracing

## Event Broadcaster Abstraction

Define broadcaster interface to decouple producers from socket implementation:

- `publishToActor(actorId, event)`
- `publishToContribution(contributionId, event)`
- `publishToRole(role, event)` (deferred unless needed)

Broadcaster consumes persisted events and mapped scopes only.

## Auth Integration

- Use existing request actor/session validation semantics adapted for socket handshake.
- Connection auth must use same session trust boundary as HTTP API.
- Session revocation event should force disconnect of affected connections.

## Subscription Registry

- Maintain mapping:
  - connection -> subscribed scopes
  - scope -> active connections
- Validate each subscription request through capability checks.
- Enforce per-connection and per-actor subscription ceilings.

## Connection Registry

- Track:
  - connection id
  - actor id
  - session id (or equivalent auth subject)
  - last heartbeat
  - connected scopes
- Support cleanup on disconnect and stale heartbeat sweep.

## Scaling Direction

### MVP

- Single process in-memory registries.
- In-process broadcaster.

### Evolution

- External pub/sub for fanout across API instances.
- Shared connection metadata strategy if horizontal scale requires it.

## Failure Strategy

- Registry corruption or auth check failure must fail closed.
- Transport send failures should not crash API runtime.
- Event publish retries limited and observable.

## OPEN_DECISION

1. Should realtime runtime live inside `apps/api` process or separate deployable gateway?
2. Which pub/sub layer should be first extraction target (Redis/Postgres listen-notify/queue)?
3. What is the required max concurrent connection target for MVP rollout gates?
