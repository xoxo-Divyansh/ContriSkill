# Observability + Operational Roadmap

## Objective

Build operational visibility around trust-critical workflows so failures are detectable, diagnosable, and auditable.

## Logging Direction

- Structured JSON logs across API modules.
- Required fields:
  - request id
  - actor id/role (when available)
  - module/action
  - outcome status
  - error code/category
- Redact secrets and sensitive payload fields.

## Metrics Roadmap

## Core Service Metrics

- request rate
- latency (p50/p95/p99)
- error rate by endpoint/error code

## Domain Workflow Metrics

- contribution lifecycle transition counts
- state conflict rate
- application acceptance latency
- moderation case throughput

## Reliability Metrics

- event outbox lag
- notification delivery success/failure rate
- retry/dead-letter volume

## Tracing Direction

- Add request tracing across:
  - controller
  - service orchestration
  - repository/event writes
- Preserve correlation id between sync request path and async event handlers.

## Operational Dashboards

- API health + latency/error.
- contribution lifecycle throughput + failures.
- auth/session runtime mode and fallback incidents.
- moderation and notification pipeline health.

## Failure Observability

- Alert classes:
  - high error rate
  - prolonged outbox lag
  - persistent DB fallback mode
  - repeated dead-letter spikes
- Ensure alerts include actionable context and ownership mapping.

## MVP vs Evolution

### MVP/near-term

- structured logs + baseline metrics + alerting essentials.
- minimal trace coverage on critical paths.

### Deferred

- full distributed tracing across extracted services.
- SLO-based automated release gating.

## OPEN_DECISION

1. Canonical observability stack/tooling selection.
2. SLO definitions for contribution transition latency and success.
3. Ownership rotation/escalation policy for trust-critical alerts.
