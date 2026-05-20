# Presence System

## Objective

Define a best-effort presence model for contribution rooms that improves collaboration awareness without being used for authorization or trust scoring.

## Presence States

- `online`: active socket + recent heartbeat.
- `idle`: connected but no activity beyond threshold.
- `reconnecting`: transient disconnect with grace window.
- `offline`: heartbeat expired or explicit disconnect.

## Contribution-Room Presence

- Presence is scoped per contribution room.
- Joining a room requires existing contribution read access.
- Presence visibility is limited to authorized participants/viewers.

## User Session Mapping

- One actor may have multiple active connections (multi-tab/device).
- Presence is actor-level aggregate:
  - `online` if any active connection exists.
- Session revocation invalidates associated presence immediately.

## Heartbeat + Reconnect Strategy

- Client heartbeat interval: short fixed cadence (MVP default configurable).
- Server marks stale if heartbeat misses threshold window.
- Reconnect flow:
  1. reconnect auth validation
  2. room resubscribe
  3. replay from last known cursor

## Stale Session Handling

- Stale or revoked session:
  - disconnect connection
  - emit local auth-expired signal to client
  - remove from presence registry
- Presence cleanup must run on disconnect and periodic sweeper.

## Data Boundaries

- Presence runtime state is ephemeral.
- No trust/reputation credits derived from presence in MVP.
- Optional audit events only for abuse/security diagnostics, not product history.

## MVP vs Deferred

### MVP

- Basic online/offline per actor in contribution room.
- Heartbeat-driven expiry.
- Multi-tab aware aggregation.

### Deferred

- Rich activity indicators (typing/editing).
- Historical presence analytics.
- Cross-room global presence panels.

## OPEN_DECISION

1. Heartbeat interval and stale timeout defaults.
2. Whether idle state is needed at MVP or defer to online/offline only.
3. Whether to persist minimal presence audit logs for incident response.
