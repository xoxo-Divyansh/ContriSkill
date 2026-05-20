# Collaborative Safety Boundaries

## Objective

Define safety, trust, and abuse boundaries for collaborative mutation flows before runtime implementation.

## Authentication Requirements

- Collaborative mutation path requires authenticated actor/session.
- Anonymous actors cannot submit collaborative mutations.
- Session revocation must invalidate further mutation acceptance immediately.

## Capability Checks

- Every mutation type maps to explicit capability requirements.
- Capability checks execute before domain mutation execution.
- Ownership-sensitive mutation types also require target-level ownership/collaborator validation.

## Replay/Spoof Prevention Direction

- Require unique `mutationId` per actor scope.
- Enforce idempotency window to reject/reconcile duplicate mutation attempts.
- Bind mutation actor id to resolved authenticated session (do not trust client-asserted actor id blindly).
- Future direction: signed mutation envelope metadata for high-risk mutation classes.

## Rate/Flood Protection Direction

- Per-session mutation rate limits.
- Per-actor mutation burst limits.
- Optional per-target mutation throttling for abuse-heavy surfaces.
- Flood threshold crossings should trigger structured security logs and optional temporary throttles.

## Sensitive Payload Boundaries

- Never expose secrets/tokens in mutation acknowledgements or realtime mutation events.
- Avoid returning raw moderation/security internals in conflict responses.
- Conflict details should be minimal, action-oriented, and non-sensitive.

## Runtime Isolation Boundaries

- Realtime transport cannot mutate domain state directly.
- Mutation execution remains in API/service path.
- Realtime channel may deliver acknowledgements/events but not bypass policy/authorization gates.

## Observability Safety

- Metrics/logs should use actor-safe identifiers and avoid sensitive payload body logging.
- Security-relevant rejection/conflict trends should be observable without exposing user private content.

## MVP vs Deferred

### MVP

- Authenticated-only mutation flow.
- Capability + ownership checks.
- Basic rate-limit direction and duplicate/replay safeguards.
- Structured safe rejection/conflict responses.

### Deferred

- Adaptive abuse scoring.
- Automated escalation integration with moderation runtime.
- Advanced cryptographic envelope verification.

## OPEN_DECISION

1. Where should rate-limit state live first (in-memory vs shared store) for multi-instance safety?
2. Should mutation flood protection start as soft-throttle or hard-block?
3. What minimum conflict detail is needed for UX without leaking sensitive data?
