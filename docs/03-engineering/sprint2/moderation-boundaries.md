# Moderation Boundaries (Sprint 2 Planning)

## Moderation in MVP: Can Do

- Open case on flagged user-generated artifacts.
- Apply bounded actions: warning, content hide, temporary restriction.
- Resolve disputes tied to verification/collaboration conflicts.
- Trigger reputation impact events through explicit policy paths.
- Record full moderation and rationale audit entries.

## Moderation in MVP: Cannot Do

- Directly edit or delete ledger history entries.
- Bypass audit logging.
- Apply permanent account bans without admin path (unless policy finalization says otherwise).
- Perform silent reputation rewrites outside policy actions.

## Dispute Handling Boundaries

- Disputes must reference a concrete target artifact and lifecycle state.
- Evidence package required before decision.
- Decision outcomes:
  - uphold original outcome,
  - overturn outcome,
  - request additional evidence.

## Audit Logging Requirements

- Required fields: actor, target type/id, action, rationale, timestamp, prior state, resulting state.
- Immutable append-only logs for moderation and settlement-impacting actions.
- Correlate case actions with affected reputation/credit events.

## Reputation Impact Boundaries

- Only policy-approved moderation outcomes can trigger trust penalties.
- Penalty events must be reversible via compensating event, never destructive rewrite.

## Abuse Prevention Controls

- Rate limit case creation and high-impact moderation endpoints.
- Dual-control (optional) for highest-risk actions.
- Monitor moderator action anomalies with admin visibility.

## Escalation Paths

- Member -> Moderator review.
- Moderator -> Admin escalation for irreversible/high-risk cases.
- Admin -> policy review backlog for repeated edge cases.

## OPEN DECISION

- Which moderation actions need two-person approval in MVP.
- SLA expectations for dispute resolution.
- Appeal window duration and maximum appeal attempts.
