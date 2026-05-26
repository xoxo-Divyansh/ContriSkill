# Auth Session Runbook

## Runtime Modes
- `memory`: no database client available.
- `database`: database-backed session persistence.
- `database_with_fallback`: runtime switched to in-memory fallback after persistence failure.

## Session Safety
- Access token extraction is length-limited and whitespace-trimmed.
- Cookie decoding is defensive and ignores malformed values.
- Resolved stale/invalid sessions are revoked and treated as unauthenticated.

## Failure Handling
- Session resolver failures default to anonymous actor and log runtime errors.
- Suspicious authenticated-header requests without session token emit a security event.
- Auth failures and capability denials produce normalized API envelopes.

## Operational Checks
- Validate health endpoint remains stable under auth persistence failures.
- Verify refresh/logout/me endpoints return expected auth error codes under missing/expired sessions.
- Monitor security events:
  - `auth_failure`
  - `capability_denied`
  - `malformed_request`
  - `rate_limit_exceeded`
  - `suspicious_request`
