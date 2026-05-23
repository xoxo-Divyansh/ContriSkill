# Security Hardening

## Objectives
- reduce authentication/session risk
- limit abuse and privilege misuse
- enforce strict input and capability boundaries

## Auth and Session Review
MVP:
- validate session cookie/token settings (secure, httpOnly, sameSite where applicable)
- confirm session expiration and renewal behavior is explicit
- verify logout/session invalidation paths

Deferred:
- adaptive/session risk scoring
- device/session management UX enhancements

## Capability Audit
MVP:
- inventory privileged actions and required roles/capabilities
- verify server-side authorization on all sensitive endpoints/actions
- ensure client-only gating is never the sole control

Deferred:
- continuous authorization drift detection
- formal least-privilege recertification cadence

## Rate Limiting Direction
MVP:
- apply route-class limits (auth, mutation, realtime handshake, public read)
- define standard rate-limit response envelope and retry hints
- log throttle events with correlation metadata

Deferred:
- dynamic tenant/user-based adaptive limits
- anomaly-driven automated tightening policies

## Replay and Spoof Protection Review
MVP:
- enforce TLS-only transport in non-local environments
- validate anti-replay controls for sensitive write/auth flows (nonce/timestamp/idempotency where relevant)
- verify trusted proxy/header handling to prevent spoofed identity metadata

Deferred:
- signed request framework for high-sensitivity operations
- continuous replay simulation testing

## Validation Audit
MVP:
- centralize input validation standards for API boundaries
- validate payload shape, enum constraints, and size limits
- sanitize user-provided content before rendering/storage paths where required

Deferred:
- shared validation schema package and generated validators
- automated boundary fuzz testing in CI

## MVP vs Deferred Summary
MVP:
- auth/session posture review
- capability enforcement audit
- baseline route-level rate limiting direction
- replay/spoof protection checks
- strict input validation expectations

Deferred:
- adaptive controls and continuous security automation

## OPEN_DECISION
- Which rate-limit primitive to standardize first (IP, user ID, session, tenant).
- Required anti-replay mechanism per sensitive endpoint category.
- Whether security checklist sign-off is mandatory for every release or only high-risk releases.
