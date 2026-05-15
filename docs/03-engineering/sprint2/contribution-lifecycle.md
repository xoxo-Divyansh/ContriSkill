# Contribution Lifecycle (Sprint 2 Definition)

## Scope

Defines the MVP contribution lifecycle and settlement boundaries.

## Planned Lifecycle States

1. `post_draft`
2. `post_published`
3. `application_submitted`
4. `application_under_review`
5. `application_accepted` or `application_rejected`
6. `collaboration_active`
7. `verification_pending`
8. `verified` or `verification_rejected`
9. `settled` (credits/reputation written)
10. `closed`

## Transition Guards

- Only post owner can accept/reject applications.
- Only accepted applicant can enter collaboration state.
- Verification requires collaboration evidence payload.
- Settlement requires terminal verification decision and idempotency check.
- Moderation hold can pause transitions for flagged entities.

## Failure/Dispute Paths

- Verification rejection:
  - return to `collaboration_active` for rework, or
  - transition to `disputed` if conflict raised.
- Dispute path:
  - moderation review,
  - decision: uphold rejection, approve manually, or void collaboration.

## Settlement Boundaries

- Credits and reputation update only on verified-approved path.
- Settlement must emit audit event and be idempotent.
- Disputed/voided cases never auto-settle.

## MVP vs Deferred

### MVP

- Single primary contribution flow.
- Manual moderation decision path.
- Basic dispute handling.

### Deferred

- Multi-stage verification scoring.
- Automated fraud detection scoring.
- Complex multi-party collaboration settlements.

## OPEN DECISION

- Re-application policy after rejection.
- Maximum verification revision loops.
- Whether partial credit is allowed for dispute-resolved outcomes.
