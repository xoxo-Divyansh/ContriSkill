# Security Hardening Implementation Guide

## Overview

This document describes the Phase 4 security and capability hardening implementation for ContriSkill. The focus is on strengthening runtime trust boundaries, safer auth/capability handling, and production-oriented security foundations without expanding feature scope.

## 1. Auth and Session Hardening

### Session Validation Safety

Session validation is now defensive and comprehensive. The `validateSessionRecord()` function in `src/security/session-validation.ts` checks:

#### 1.1 Null/Undefined Safety
- Returns safe anonymous actor if session is missing
- Never crashes on malformed session data

#### 1.2 Required Field Validation
- All required fields are checked: `id`, `userId`, `role`, `state`, `issuedAt`, `expiresAt`
- Missing fields trigger high-risk audit logging
- Session is rejected if any required field is missing

#### 1.3 Expiration Checks
- Compares `expiresAt` timestamp against current time
- Returns anonymous actor with `sessionState: "expired"` if expired
- No exception thrown, enabling proper error response

#### 1.4 Revocation Checks
- Sessions with `revokedAt` timestamp are treated as invalid
- Revocation takes priority (checked before expiration)

#### 1.5 State Machine Validation
- Only `"authenticated"` state is valid for active sessions
- Any other state transitions actor to anonymous
- Unexpected states are logged with medium risk level

#### 1.6 Timestamp Coherence
- `issuedAt` must be <= now <= `expiresAt`
- `issuedAt` must be <= `expiresAt`
- `lastSeenAt` is allowed 60 seconds clock skew tolerance
- Incoherent timestamps indicate potential tampering (high risk)

### Token Format Validation

The `isValidTokenFormat()` function validates tokens defensively:

```typescript
// Valid token format: atk_<uuid> or rtk_<uuid>
// - Prefix: atk (access token) or rtk (refresh token)
// - UUID: proper v4 format validation
// - Length: 35-50 characters (UUID is 36 chars)
```

Tokens failing format validation are:
- Not sent to session store
- Logged as potential attack
- Treated as missing token (anonymous actor)

### Request Actor Middleware

The `createRequestActorMiddleware()` now:

1. **Resolves token from request** (header or cookie)
2. **Validates token format** before querying session store
3. **Validates session record** with comprehensive diagnostics
4. **Logs suspicious patterns** for observability
5. **Falls back to anonymous** on any validation failure
6. **Never crashes** - all errors are caught and logged

## 2. Capability Enforcement Hardening

### Centralized Capability Audit

The `auditCapabilityDenial()` function centralizes capability denial tracking:

```typescript
export type CapabilityDenialEvent = {
  correlationId?: string;
  timestamp: string;
  actor: RequestActor;
  requiredCapability: AuthCapability;
  denyReason: "unauthenticated" | "insufficient_capability";
  requestPath?: string;
  requestMethod?: string;
  clientIp?: string;
};
```

All capability denials are:
- Logged to observability pipeline
- Included in audit trail
- Categorized as auth failure (401) or permission failure (403)
- Normalized to consistent response format

### Normalized Authorization Error Response

All authorization failures (401/403) return:

```json
{
  "error": {
    "code": "UNAUTHENTICATED|FORBIDDEN",
    "message": "descriptive message"
  },
  "meta": {
    "requestId": "correlation-id",
    "timestamp": "ISO8601"
  }
}
```

This consistency enables:
- Frontend UX consistency
- Log analysis and alerting
- Compliance auditing
- Security incident response

### Middleware Consistency

All capability-related middleware now use the same audit pipeline:
- `requireAuthMiddleware` - authentication checks
- `requireCapabilityMiddleware` - fine-grained capability checks
- `requireRoleMiddleware` - role-based access control

## 3. Input Validation Hardening

### Defensive Validation Functions

Located in `src/security/input-validation.ts`:

#### 3.1 Payload Size Validation
```typescript
validatePayloadSize(payload, { maxSizeBytes: 102400, correlationId })
```
- Prevents DoS from large payloads
- Default limit: 100KB
- Configurable per endpoint if needed

#### 3.2 Object Structure Validation
```typescript
validateObjectStructure(obj, { maxDepth: 10, correlationId })
```
- Prevents prototype pollution via `__proto__`, `constructor`, `prototype`
- Validates object nesting depth
- Prevents field name injection attacks
- Logs suspicious patterns

#### 3.3 String Value Validation
```typescript
validateStringValue(value, { maxLength: 10000, allowHtml: false, correlationId })
```
- Length limits on string fields
- Basic injection pattern detection (SQL, command, path traversal, script)
- Note: Not a replacement for parameterized queries and proper escaping
- Supplementary safety check at API boundary

#### 3.4 Malformed Request Normalization
```typescript
normalizeMalformedRequest(error, { correlationId, requestPath })
```
- Catches JSON parsing errors
- Returns normalized diagnostic without exposing internals
- Logs to observability for pattern detection

### Input Validation Middleware

The `createInputValidationMiddleware()` applies defensive checks:

1. **Only on request methods with bodies** (POST, PUT, PATCH)
2. **Payload size validation** - catches large/malicious payloads
3. **Object structure validation** - catches prototype pollution, deep nesting
4. **Returns 400 Bad Request** on validation failure
5. **Never crashes** - all validation returns results, no exceptions

Integration in `server.ts`:
```typescript
app.use(createInputValidationMiddleware({
  maxPayloadSizeBytes: 1024 * 100, // 100KB
  maxObjectDepth: 10
}));
```

## 4. Rate Limiting Foundation

### Rate Limiter Implementation

The `RateLimiter` class in `src/security/rate-limiter.ts` provides lightweight in-memory rate limiting:

```typescript
type RateLimitPolicy = {
  maxRequests: number;      // e.g., 10 requests
  windowSeconds: number;    // per 300 seconds (5 min)
  name: string;            // "auth_endpoints"
  includeRetryAfter?: boolean;
};
```

#### 4.1 How It Works

1. **Window tracking**: Maintains `key -> { count, windowStart }`
2. **Window expiration**: If `now - windowStart > windowSeconds`, reset count
3. **Increment on allow**: Increment counter and allow request
4. **Reject on limit**: Return 429 when counter >= maxRequests

#### 4.2 Rate Limit Key Extraction

The `extractRateLimitKey()` function provides fair-share rate limiting:

```typescript
// Authenticated users: rate-limit by session
extractRateLimitKey({
  authenticated: true,
  sessionId: "user123"
  // -> "session_user123"
})

// Anonymous users: rate-limit by IP
extractRateLimitKey({
  authenticated: false,
  clientIp: "192.168.1.1"
  // -> "ip_192.168.1.1"
})
```

This prevents one user behind a proxy from exhausting quota and allows multiple users to fairly share IP-based limits.

#### 4.3 Standard Policies

```typescript
getStandardRateLimitPolicies("production") // or "development"

{
  auth: { maxRequests: 10, windowSeconds: 300, ... },       // 10/5min
  mutation: { maxRequests: 100, windowSeconds: 60, ... },   // 100/min
  realtime: { maxRequests: 50, windowSeconds: 60, ... },    // 50/min
  public_read: { maxRequests: 1000, windowSeconds: 60, ... } // 1000/min
}
```

Development policies are more generous for testing.

#### 4.4 Rate Limit Middleware

```typescript
app.use("/api/v1/auth/login", 
  createRateLimitMiddleware(rateLimiter, "auth")
);
```

When rate-limited, response includes:
- Status: 429 Too Many Requests
- Header: `Retry-After: <seconds>`
- Header: `X-RateLimit-Remaining: 0`
- Header: `X-RateLimit-Reset: <seconds>`

#### 4.5 MVP Limitations

This is **single-process only**:
- Uses in-memory Map (not persisted)
- Resets on server restart
- Not suitable for multi-process or distributed deployment

**For production multi-instance deployment**, replace with Redis-backed rate limiter:
- Check `node_modules/redis` integration
- Use shared rate-limit key prefix
- Coordinate window resets across instances

### Auth-Sensitive Endpoint Protection

Recommended rate-limiting per endpoint class:

```typescript
// routes/auth.ts
router.post("/register", 
  createRateLimitMiddleware(rateLimiter, "auth"),
  requireCapabilityMiddleware("auth:register"),
  authController.register
);

router.post("/login",
  createRateLimitMiddleware(rateLimiter, "auth"),
  authController.login
);

router.post("/refresh",
  createRateLimitMiddleware(rateLimiter, "auth"),
  requireAuthMiddleware,
  authController.refresh
);

// routes/contribution.ts
router.post("/",
  createRateLimitMiddleware(rateLimiter, "mutation"),
  requireCapabilityMiddleware("contribution:create"),
  contributionController.create
);

// routes/health.ts
router.get("/health",
  createRateLimitMiddleware(rateLimiter, "public_read"),
  healthController.check
);
```

### Replay/Spam Resistance Direction

Current foundation supports:

1. **Session-based rate limiting** - sessions can't spam faster than allowed
2. **IP-based rate limiting** - anonymous clients get fair-share limits
3. **Request logging with correlation IDs** - enables incident investigation
4. **Retry-After headers** - clients can implement exponential backoff

Future enhancements (post-MVP):
- Nonce-based replay detection for critical operations
- Timestamp validation for request freshness
- HMAC signing for high-sensitivity operations
- Behavioral analytics for anomaly detection

## 5. Security Diagnostics

### Observability Integration

All security hardening events are logged to the observability pipeline:

#### 5.1 Auth Events
```
[auth_failure] Session token format invalid | correlationId | clientIp | suspiciousPattern
[auth_failure] Session record has missing fields | correlationId | sessionId | riskLevel
[auth_failure] Session validation failed | correlationId | reason | riskLevel
[auth_denial] Capability enforcement denial | correlationId | requiredCapability | denyReason
```

#### 5.2 Validation Events
```
[validation_failure] Request payload exceeds size limit | correlationId | payloadSize
[validation_failure] Object contains dangerous key | correlationId | key
[validation_failure] Object structure exceeds max depth | correlationId | maxDepth
[validation_failure] String contains suspicious pattern | correlationId | pattern
```

#### 5.3 Rate Limiting Events
```
[rate_limit] Rate limit exceeded for policy | correlationId | policy | key_hash
```

### Suspicious Pattern Detection

Events marked with `suspiciousPattern: true`:
- Malformed session records
- Invalid token formats
- Prototype pollution attempts
- Deep object nesting
- Injection pattern matches
- Timestamp incoherence

These enable:
- Real-time alerting
- Pattern aggregation
- Security incident response
- Compliance audit trails

### Audit Trail Structure

Every security event includes:
```typescript
{
  timestamp: ISO8601,
  correlationId: request-id,
  actor: { actorType, role, userId },
  requestPath: "/api/v1/...",
  requestMethod: "POST",
  clientIp: "192.168.1.1",
  decision: "allowed" | "denied",
  reason: "descriptive",
  riskLevel?: "low" | "medium" | "high",
  suspiciousPattern?: boolean
}
```

## 6. Security Checklist

Before deploying to production, verify:

- [ ] All middleware applied in correct order in `server.ts`
- [ ] Rate-limit policies configured for your traffic patterns
- [ ] Input validation limits appropriate for your API schemas
- [ ] Observability pipeline configured to receive security events
- [ ] Alerts configured for high-risk events (suspicious patterns, rate limits)
- [ ] Session TTL and rotation appropriate for your security model
- [ ] HTTPS/TLS enforced in non-local environments
- [ ] CORS configuration restricts to known origins
- [ ] Helmet security headers enabled
- [ ] Sensitive data excluded from logs (tokens, passwords, PII)

## 7. Performance Considerations

### Security Overhead

Hardening adds minimal overhead per request:

- **Token format validation**: ~100µs (regex check)
- **Session validation**: ~50µs (timestamp comparisons)
- **Payload validation**: ~200µs (object traversal)
- **Rate limit check**: ~10µs (map lookup)

Total: ~360µs per request = negligible at typical request latencies (>10ms)

### Memory Impact

Rate limiter in-memory storage:
- Each tracked key: ~200 bytes
- At 10K concurrent clients: ~2MB

For production multi-instance deployment, use Redis instead.

## 8. Testing

See [../../../tests/security/](../../../tests/security/) for comprehensive test coverage:

- `session-validation.test.ts` - Session validation scenarios
- `capability-audit.test.ts` - Capability denial tracking
- `input-validation.test.ts` - Input validation patterns
- `rate-limiter.test.ts` - Rate-limit policy verification
- `security-integration.test.ts` - End-to-end security flows

## 9. Migration Path

When implementing hardening in existing deployments:

1. **Phase 1**: Deploy with monitoring-only (log events, don't reject)
2. **Phase 2**: Enable rejection after 1 week observing patterns
3. **Phase 3**: Tune limits based on production traffic
4. **Phase 4**: Adjust alert thresholds based on false positive rate

## 10. References

- [auth-session-runbook.md](auth-session-runbook.md) - Troubleshooting guide
- [capability-enforcement-guide.md](capability-enforcement-guide.md) - Authorization patterns
- [correlation-id-guide.md](correlation-id-guide.md) - Distributed tracing
- [logging-observability.md](logging-observability.md) - Observability architecture
