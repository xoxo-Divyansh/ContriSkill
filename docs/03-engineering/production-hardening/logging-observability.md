# Logging and Observability

## Objectives
- make incidents diagnosable with minimal guesswork
- provide cross-service traceability for user-impacting flows
- keep diagnostics safe for production exposure

## Structured Logging Direction
MVP:
- adopt JSON structured logs for server/API paths
- include stable fields: `timestamp`, `level`, `service`, `env`, `request_id`, `route`, `user_scope`, `event`, `error_code`
- redact sensitive fields by default (tokens, secrets, PII)

Deferred:
- consistent structured logging adapters for all runtimes and workers
- schema-enforced log contracts with versioning

## Request Correlation IDs
MVP:
- generate or propagate `X-Request-Id` at ingress
- pass correlation ID across web -> API -> persistence boundaries
- include correlation ID in user-visible support context where appropriate

Deferred:
- correlation mapping across async jobs and realtime channels
- integration with distributed tracing span IDs

## Realtime Diagnostics Direction
MVP:
- capture connection lifecycle events (connect, auth, disconnect, reconnect)
- record reconnect attempts and terminal failures
- classify events by severity for signal-to-noise control

Deferred:
- realtime channel health dashboards and anomaly detection
- per-tenant/channel operational metrics

## Production-Safe Diagnostics Exposure
MVP:
- separate internal diagnostic detail from user-facing errors
- expose minimal incident reference IDs to users/support
- guard diagnostic endpoints by role and environment

Deferred:
- tiered diagnostic consoles with scoped redaction views
- policy-driven debug payload controls

## Error Tracking Direction
MVP:
- central capture for unhandled exceptions and rejected promises
- group errors by normalized error code and stack fingerprint
- attach release version and request correlation metadata

Deferred:
- noise reduction automation and ownership routing
- SLO-linked alerting and regression detection pipelines

## MVP vs Deferred Summary
MVP:
- JSON logs with redaction
- request correlation IDs end-to-end
- baseline realtime lifecycle diagnostics
- central exception capture

Deferred:
- full tracing stack and advanced dashboards
- alert intelligence and ownership automation

## OPEN_DECISION
- Primary observability backend and retention policy by environment.
- Required correlation header name standard if multiple gateways exist.
- Alert threshold model: static thresholds vs error-budget-based triggers.
