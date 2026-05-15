# Roles and Permissions (Sprint 2 Planning)

## Actor Model

- `anonymous`: unauthenticated visitor.
- `member`: authenticated contributor.
- `moderator`: trust and dispute operations.
- `admin`: platform governance and override authority.

## MVP Permission Matrix (High-Level)

- Anonymous:
  - read public posts/profiles.
  - cannot apply, collaborate, verify, review, or moderate.
- Member:
  - create posts, apply, collaborate, submit verification evidence, review.
  - view own credit/reputation/audit-facing history.
- Moderator:
  - open/review moderation cases, apply moderated outcomes.
  - cannot edit ledger history directly.
- Admin:
  - assign moderator roles, apply high-risk overrides, review complete audit scope.

## Route/API Guard Mapping

- Public routes/API: no auth required.
- Auth-required: `require-auth`.
- Role-required: `require-role([moderator|admin])`.
- High-risk endpoints: auth + role + policy checks + audit log requirement.

## Trust-Level Permission Principles

- Trust score influences discoverability and rate limits, not base legal authorization.
- Settlement/ledger mutations remain role/policy controlled.
- Moderation actions always produce audit events.

## Moderator/Admin Boundaries

- Moderator can recommend and apply bounded actions.
- Admin required for irreversible or high-impact trust actions.
- No silent overrides; all overrides must be auditable.

## OPEN DECISION

- Whether moderators can temporarily suspend posting or only escalate to admin.
- Granularity of admin scopes (global admin vs domain-limited admin).
- Trust-level threshold rules for unlocking advanced workflows.
