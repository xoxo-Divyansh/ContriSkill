# Realtime Observability

## Objective

Define observability requirements for realtime runtime health, reliability, and incident diagnosis.

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

### Deferred

- Full distributed tracing across pub/sub and gateway layers.
- Per-tenant/per-room SLO dashboards.
- Automated remediation workflows.

## OPEN_DECISION

1. Metrics backend choice and dashboard ownership.
2. Initial SLO targets for connection uptime and delivery latency.
3. Health endpoint detail level for realtime runtime exposure.
