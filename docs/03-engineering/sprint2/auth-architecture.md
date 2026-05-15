# Auth Architecture (Sprint 2 Planning)

## Scope

Defines real authentication/session direction for MVP implementation planning.

## Implemented Baseline (from Sprint 1)

- API auth module boundaries and placeholder contracts.
- Request actor middleware + role/auth guard shells.
- Web provider hierarchy and route wrappers for future auth wiring.

## Planned Sprint 2 Auth Direction

- Credential strategy for MVP: email + password (or passwordless) with single primary flow.
- Session strategy: server-managed session with revocable session record.
- Client strategy: httpOnly secure cookie for session token transport.
- API strategy: actor resolved from session on each request, then policy guard evaluation.

## Session Model

- Session entity fields (planned): `id`, `userId`, `issuedAt`, `expiresAt`, `revokedAt`, `lastSeenAt`, `ipHash`, `userAgentHash`.
- Lifecycle:
  - Create on sign-in.
  - Rotate on sensitive auth events.
  - Revoke on sign-out, password reset, admin action, or security event.
  - Expire by TTL.

## Token/Session Lifecycle

- Login success -> session issue -> set cookie -> actor available.
- Request -> cookie parse -> session validate -> actor inject.
- Refresh/renew -> bounded renewal window.
- Logout -> revoke active session.
- Security anomaly -> forced revoke + audit event.

## Protected Resource Strategy

- No resource checks in controllers directly.
- Guard chain:
  1. `request-actor`
  2. `require-auth`
  3. `require-role` / policy evaluation
- Fail closed by default when actor context missing/invalid.

## Web/API Boundary

- Web never stores long-lived secrets in local storage.
- API is source of truth for session state and role evaluation.
- Web route wrappers are UX gates, not security boundary substitutes.

## Security Risks

- Session fixation.
- Stolen session cookie replay.
- Missing revocation checks in high-risk endpoints.
- Role escalation through inconsistent guard wiring.

## OPEN DECISION

- Final MVP auth mode: password vs passwordless magic link.
- Session TTL and renewal window values.
- Single-session vs multi-session policy.
- Device/session management UI inclusion in MVP or deferred.
