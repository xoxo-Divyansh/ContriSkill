# Realtime Observability

## Objective

Define observability requirements for realtime runtime health, reliability, and incident diagnosis.

## Current Phase 3 Runtime Diagnostics Surface (Implemented)

### Endpoint

- `GET /api/v1/internal/realtime/stats`
- Availability: non-production only.
- Intended environments: local development and controlled staging/debug contexts.
- Production behavior: endpoint is not mounted/exposed.

### Exposure Safety Boundaries

- Returns counters and high-level runtime state only.
- Does not return websocket payload bodies.
- Does not return access tokens, refresh tokens, session secrets, or raw actor-sensitive data.
- Does not expose contribution content or moderation-sensitive records.

### Current Response Shape (Summary)

- `data.counters`: aggregate realtime runtime counters.
- `data.activeConnections`: current open realtime connection count.
- `data.activeReconnectSnapshots`: active reconnect replay snapshots in memory.
- `data.generatedAt`: server timestamp for snapshot generation.

### Current Counters Exposed

- `sequenceGapEvents`
- `rejectedEvents`
- `reconnectAttempts`
- `reconnectRestores`
- `staleEvents`
- `duplicateEvents`
- `outOfOrderEvents`
- `futureSkewEvents`
- `subscriptionReplayAttempts`
- `subscriptionReplayRestores`
- `subscriptionReplayFailures`
- `replayWindowExpirations`
- `heartbeatTimeoutDisconnects`
- `orphanedPresenceCleanups`
- `broadcastDispatchFailures`

## Operator/Debug Usage (MVP)

- Confirm reconnect + replay behavior after intentional network interruption.
- Diagnose malformed/stale/out-of-order inbound event pressure.
- Detect replay-window expiry patterns during unstable sessions.
- Validate stale connection cleanup and heartbeat timeout behavior.
- Validate subscription recovery behavior before enabling higher realtime load.

## Operational Notes

- Treat this endpoint as a development operator aid, not a long-term production telemetry API.
- Use structured runtime logs together with stats snapshots for incident triage.
- If counters trend upward unexpectedly (for example `rejectedEvents`, `subscriptionReplayFailures`), prioritize contract and client-runtime validation.

## Connection Metrics

- Active connections (total, per actor role, per route scope).
- New connections/sec and disconnects/sec.
- Connection auth failures (rate + reason).
- Concurrent connections per actor/session/IP.

## Event Metrics

- Events published/sec by category.
- Events dropped/rejected (with reason).
- End-to-end publish latency (event persisted -> delivered).
- Replay requests/sec and replay gap failures.

## Failure Visibility

- Transport-level errors (handshake, subscribe, send, heartbeat).
- Authorization failures by capability and route scope.
- Backpressure indicators (queue depth, send lag).
- Retry counts and exhausted retry incidents.

## Disconnect Tracking

- Disconnect reason taxonomy:
  - client close
  - network timeout
  - heartbeat stale
  - auth/session revoked
  - server shutdown/error
- Track unexpected disconnect spikes.

## Reconnect Tracking

- Reconnect attempts per session.
- Success rate by retry attempt number.
- Time-to-recover metric from disconnect to reconnected.
- Replay success/failure after reconnect.

## Operational Diagnostics

- Correlation IDs linking HTTP command -> persisted event -> realtime delivery.
- Structured logs with actor/session/connection-safe identifiers.
- Health endpoints should include realtime subsystem status summary (non-sensitive).
- Alerting thresholds for sustained auth failures, replay gaps, and send failures.

## MVP vs Deferred

### MVP

- Core connection/event counters.
- Error taxonomy logging.
- Basic alert thresholds.
- Development-only internal diagnostics endpoint for realtime runtime counters.

### Deferred

- Full distributed tracing across pub/sub and gateway layers.
- Per-tenant/per-room SLO dashboards.
- Automated remediation workflows.
- Production-grade protected observability endpoint and/or metrics exporter.

## OPEN_DECISION

1. Metrics backend choice and dashboard ownership.
2. Initial SLO targets for connection uptime and delivery latency.
3. Production-safe exposure model for realtime diagnostics (pull endpoint vs metrics exporter).
4. Authentication/authorization model for future production observability endpoints.
5. Counter reset/retention semantics across runtime restarts and deploys.
