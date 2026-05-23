# Persistence Hardening

## Objectives
- reduce data-loss and inconsistency risk
- ensure safe migration practices
- define predictable retry/idempotency behavior

## DB and Session Reliability
MVP:
- enforce connection pool limits and timeout defaults per environment
- document transactional boundaries for critical writes
- validate session store TTL and renewal behavior

Deferred:
- multi-region read strategy and failover orchestration
- advanced consistency checks and automated drift repair

## Migration Workflow
MVP:
- migration files are immutable once merged
- forward-only migration strategy for production
- require dry-run and backup verification in non-prod before prod rollout
- document rollback playbook at release level (app rollback + data mitigation)

Deferred:
- automated migration canary and progressive rollout controls
- schema compatibility linting against app versions

## Fallback Behavior
MVP:
- define service-degraded behavior when DB/session store is partially unavailable
- fail closed for auth/session validation errors
- avoid destructive retries for unknown write outcomes

Deferred:
- read-only mode automation for major incidents
- selective feature degradation toggles by subsystem

## Stale Session Recovery
MVP:
- detect invalid/expired sessions deterministically
- clear stale client state and force re-auth with user-safe messaging
- avoid infinite refresh/retry loops

Deferred:
- session continuity tokens for smoother cross-device recovery
- anomaly detection for repeated stale-session patterns

## Idempotency and Retry Expectations
MVP:
- require idempotency keys for write operations exposed to retry-prone clients
- classify retryable vs non-retryable errors explicitly
- cap retries with exponential backoff for transient failures

Deferred:
- centralized idempotency key service and replay analysis tooling
- automated duplicate-write reconciliation

## MVP vs Deferred Summary
MVP:
- connection/session baseline reliability
- forward-only, controlled migration workflow
- deterministic stale-session recovery
- explicit idempotency and retry policy

Deferred:
- advanced failover and incident automation controls

## OPEN_DECISION
- Which write endpoints require mandatory idempotency at MVP.
- Acceptable maximum migration lock window for production deploys.
- Whether session storage remains centralized or service-local by domain.
