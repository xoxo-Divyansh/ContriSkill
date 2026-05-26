# Security Hardening

## Scope
- Session and authentication runtime hardening.
- Capability enforcement normalization.
- Defensive payload validation and malformed request handling.
- Rate limiting foundation for auth-sensitive endpoints.
- Security diagnostics and observability event shape.

## Implemented Boundaries
- Shared auth/capability failure responder now emits consistent `UNAUTHENTICATED`/`FORBIDDEN` envelopes.
- Malformed JSON payloads are normalized to `VALIDATION_ERROR` with safe messaging.
- Unknown request-body fields are rejected for auth and contribution mutation endpoints.
- Session resolution revokes stale/invalid sessions instead of silently continuing.
- Lightweight in-memory throttling protects `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh`.

## Production Direction
- Replace in-memory throttling state with shared Redis or gateway-backed counters.
- Add request correlation ids into security event context for cross-service tracing.
- Add endpoint-specific policy tables for progressive hardening without route-level duplication.
