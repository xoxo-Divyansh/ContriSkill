# Deployment Architecture

## Objectives
- define safe, repeatable deployment topology and order
- align web/API rollout with migration safety
- enforce environment gates before production exposure

## Web Deployment Strategy
MVP:
- immutable build artifacts per commit
- preview deployment per PR for validation
- production promotes only from validated main branch artifact

Deferred:
- multi-region edge optimization strategy
- advanced traffic shaping and canary percentages

## API Deployment Strategy
MVP:
- independent API deploy pipeline with explicit version metadata
- backward compatibility expectations documented for active clients
- health-check gate before traffic cutover

Deferred:
- blue/green or progressive traffic splitting automation
- per-endpoint canary analysis controls

## Database Hosting Assumptions
MVP assumptions:
- managed relational database with automated backups
- TLS in transit and at-rest encryption enabled
- non-production instances logically separated from production

Deferred:
- cross-region replication with tested failover drills
- automated backup restore verification cadence

## Migration and Deploy Order
MVP sequence:
1. validate schema migration in dev/preview
2. apply production-compatible migration
3. deploy API compatible with new and prior schema state (where possible)
4. deploy web against updated API contract
5. monitor post-deploy error and latency indicators

Deferred:
- automated phased rollout with policy checks and rollback triggers

## Environment Gates
MVP:
- required pre-deploy checks pass (tests/lint/typecheck/security baseline)
- migration plan present for schema-touching releases
- release notes include risk and rollback plan
- on-call or owner acknowledgement for production deploy windows

Deferred:
- policy-as-code gates with automatic exception workflows
- SLO-aware deploy pause/resume automation

## MVP vs Deferred Summary
MVP:
- immutable artifacts
- PR previews
- explicit migration/deploy sequence
- baseline release gates

Deferred:
- advanced progressive delivery automation

## OPEN_DECISION
- Final hosting topology: unified platform vs split web/API providers.
- Whether production deploys are manual approval or time-window auto-promoted.
- Required compatibility window for API versions during web rollout.
