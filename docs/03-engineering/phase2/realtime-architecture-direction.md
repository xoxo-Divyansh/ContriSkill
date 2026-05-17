# Realtime Architecture Direction

## Objective

Define phased realtime direction for contribution/collaboration visibility without coupling core lifecycle correctness to websocket availability.

## Design Principles

- Realtime is an enhancement layer, not source of truth.
- API + DB remain authoritative.
- Realtime messages are derived from persisted state/events.

## Channel Direction

- Phase 2 recommendation:
  - server-sent event stream or websocket gateway bound to authenticated session actor.
- Use actor-scoped channels:
  - user personal stream
  - collaboration stream (participant-only)
  - moderator stream (privileged)

## Collaboration Sync Boundaries

- Push events for:
  - post/application state changes
  - collaboration state transitions
  - verification/dispute status changes
- Do not push unpersisted intermediate client drafts as canonical updates.

## Presence/Session Considerations

- Presence is best-effort; never trust presence for authorization.
- Presence state should expire quickly without heartbeat.
- Session revocation must immediately invalidate realtime channel authorization.

## Future Realtime Editing Considerations

- Collaborative editing is deferred.
- If introduced:
  - isolate to document/deliverable layer
  - use operational transform/CRDT only when concrete product need is proven

## Failure Behavior

- If realtime channel fails:
  - clients continue with pull-based API refresh.
- Reconnect flow should request delta since last event cursor.

## MVP vs Evolution

### MVP/near-term

- basic actor-authenticated event stream for contribution lifecycle updates.
- no collaborative editing.

### Deferred

- rich multi-user presence.
- low-latency shared editing.
- complex room coordination services.

## OPEN_DECISION

1. SSE vs WebSocket as first production transport.
2. Event replay window duration for reconnect.
3. Whether moderator streams require separate gateway boundary.
