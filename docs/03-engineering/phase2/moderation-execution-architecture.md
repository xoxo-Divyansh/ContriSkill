# Moderation Execution Architecture

## Objective

Define execution-grade moderation architecture that enforces trust integrity while preserving strict auditability and separation of concerns.

## Workflow Execution Boundaries

- Moderation execution is separate from contribution command handlers.
- Moderation actions operate through dedicated moderation application services.
- Contribution services only expose moderation hooks/locks, not full moderation policy logic.

## Core Flow Direction

1. Report/dispute intake creates moderation case.
2. Case triage determines severity and workflow path.
3. Moderator actions executed via explicit action commands.
4. Each action produces audit event and any downstream domain effect.
5. Case closure records final decision rationale.

## Escalation Direction

- Tier 1: routine abuse/spam triage.
- Tier 2: trust-impacting disputes.
- Tier 3: admin review for high-risk penalties.
- Escalation transitions must be explicit, auditable state changes.

## Audit/Event Requirements

- Every moderation action must capture:
  - actor
  - target
  - reason code
  - policy reference
  - timestamp
  - linked evidence pointers
- No silent state mutations on moderated entities.

## Admin vs Moderator Operational Separation

- Moderator:
  - case handling within bounded policy scope
  - can lock/unlock workflows per policy
- Admin:
  - policy override
  - irreversible trust-impact operations
  - governance configuration ownership

## Safety Controls

- Require idempotency for trust-impacting moderation writes.
- Enforce dual-control for highest-risk actions (future phase).
- Lock affected collaboration/contribution state during active severe case.

## MVP vs Evolution

### MVP/near-term

- case lifecycle + action logging + bounded moderation actions.
- policy-enforced locks in contribution flows.

### Deferred

- advanced evidence review tooling.
- automated escalation scoring.
- multi-party arbitration flows.

## OPEN_DECISION

1. Which actions require admin-only approval in MVP.
2. Whether severe penalties require two-human approval at launch.
3. Participant visibility level into active moderation case status.
