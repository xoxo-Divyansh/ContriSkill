# Auth/Session Runbook

Troubleshooting guide for authentication and session issues in ContriSkill.

## Table of Contents

1. [Session Lifecycle](#session-lifecycle)
2. [Common Issues](#common-issues)
3. [Debugging Procedures](#debugging-procedures)
4. [Security Diagnostics](#security-diagnostics)
5. [Recovery Procedures](#recovery-procedures)

## Session Lifecycle

### 1. Session Creation

```
User POST /auth/register or /auth/login
    ↓
Credentials validated
    ↓
Session created:
  - id: unique session identifier
  - userId: authenticated user id
  - role: user's role
  - state: "authenticated"
  - accessToken: short-lived token
  - refreshToken: long-lived token
  - issuedAt: creation timestamp
  - expiresAt: expiration timestamp
  - lastSeenAt: most recent access
    ↓
Response: { accessToken, refreshToken, user }
```

### 2. Session Usage

```
Client stores tokens:
  - accessToken: in-memory or secure storage
  - refreshToken: secure storage (httpOnly cookie or device storage)

On each authenticated request:
  POST /api/v1/contribution
  Header: "x-session-token: <accessToken>"
    ↓
Server validates:
  1. Token format valid (atk_<uuid>)
  2. Session exists in store
  3. Session not revoked
  4. Session not expired
    ↓
Permitted: request proceeds
Denied: 401 Unauthorized
```

### 3. Token Rotation

```
Tokens approach expiration:
  - accessToken expires first
  - If still needed, use refreshToken

POST /auth/refresh
  Body: { refreshToken }
    ↓
Server validates:
  1. RefreshToken format valid (rtk_<uuid>)
  2. Session exists for this refreshToken
  3. Session not revoked
  4. Session not expired
    ↓
Response: { accessToken: NEW, refreshToken: NEW }
    ↓
Client updates stored tokens
```

### 4. Session Logout

```
User POST /auth/logout
  Header: "x-session-token: <accessToken>"
    ↓
Server:
  1. Validates session
  2. Sets revoked_at timestamp
  3. Marks state: "expired"
    ↓
Session now invalid:
  - accessToken no longer works
  - refreshToken no longer works
  - All future requests return 401
```

## Common Issues

### Issue 1: "401 Unauthorized" on Authenticated Requests

**Symptoms:**
- User reports "Not logged in" despite having logged in
- Requests to protected endpoints return 401
- Error: `{"error": {"code": "UNAUTHENTICATED", "message": "..."}}`

**Root Causes:**

#### 1a. Token Not Sent
```
Client sending request WITHOUT token header:
  POST /api/v1/contributions
  # Missing: x-session-token header
    ↓
Server sees no token → anonymous actor → 401
```

**Fix:**
```javascript
// Ensure client sends token
const response = await fetch("/api/v1/contributions", {
  method: "POST",
  headers: {
    "x-session-token": accessToken,  // Include this!
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});
```

#### 1b. Token Format Invalid
```
Client sending malformed token:
  x-session-token: invalid_token_format
  x-session-token: eyJhbGciOi... (JWT instead of opaque)
    ↓
Server rejects format → anonymous actor → 401
```

**Debug:**
```bash
# Check token format
echo "atk_550e8400-e29b-41d4-a716-446655440000" | grep -E "^[art]tk_[0-9a-f]{8}-"
# Should match pattern

# Bad formats:
echo "invalid_token" | grep -E "^[art]tk_[0-9a-f]{8}-"  # No match
echo "eyJhbGci" | grep -E "^[art]tk_[0-9a-f]{8}-"       # No match
```

**Fix:**
```typescript
// Verify token before sending
export const isValidAccessToken = (token: string): boolean => {
  return token.startsWith("atk_") && token.includes("-");
};
```

#### 1c. Session Expired
```
User logged in 2 hours ago with default 24h TTL:
  Session.expiresAt: "2026-05-26T08:00:00Z"
  Current time: "2026-05-26T10:05:00Z"
    ↓
Expiration check: expiresAt <= now → true
    ↓
Session invalid → anonymous actor → 401
```

**Check:**
```javascript
// Client-side check
function isTokenExpired(session) {
  const expiresAt = new Date(session.expiresAt).getTime();
  const now = Date.now();
  return expiresAt <= now;
}

if (isTokenExpired(session)) {
  // Refresh tokens before making request
  const refreshed = await refreshSession(session.refreshToken);
  session = refreshed;
}
```

**Server logs** will show:
```
[session_validation] reason: "session_expired", expiresAt: "...", now: "..."
```

**Fix:**
```typescript
// Extend session TTL if needed (ops decision)
const sessionTtlMinutes = 1440; // 24 hours
```

#### 1d. Session Revoked
```
Admin revoked user's session (security incident):
  Session.revokedAt: "2026-05-26T09:00:00Z"
    ↓
Revocation check: revokedAt present → true
    ↓
Session invalid → anonymous actor → 401
```

**Check:**
```bash
# Query session store
SELECT id, user_id, revoked_at FROM auth_sessions 
WHERE user_id = 'user123' 
ORDER BY issued_at DESC LIMIT 1;

# If revoked_at is NOT NULL, session was revoked
```

**Fix:** User must log in again to get new session

#### 1e. Token Not Found in Store
```
User has valid-format token but server has no matching session:
  Token: "atk_550e8400-e29b-41d4-a716-446655440000"
  Lookup: SELECT * FROM auth_sessions WHERE access_token_hash = ?
  Result: (no rows)
    ↓
Session not found → anonymous actor → 401
```

**Possible Causes:**
- Server restarted (in-memory session store lost all sessions)
- Session store deleted by cleanup job
- Token never existed / bad token
- Wrong environment (dev vs prod)

**Debug:**
```bash
# Check if using in-memory or database store
grep -r "InMemorySessionStore\|PostgresSessionStore" src/modules/auth

# In-memory store: sessions lost on restart
# Database store: should persist across restarts
```

### Issue 2: "403 Forbidden" on Requests

**Symptoms:**
- User is logged in (200 on /session endpoint)
- But gets 403 on specific endpoints
- Error: `{"error": {"code": "FORBIDDEN", "message": "Capability 'X' is required"}}`

**Root Causes:**

#### 2a. Insufficient Role
```
User role: "user"
Endpoint requires: "moderator" or higher
    ↓
Role check fails → 403 Forbidden
```

**Check:**
```bash
# Get user's session and role
SELECT role FROM auth_sessions WHERE user_id = 'user123' LIMIT 1;
# Returns: "user"

# Check endpoint requirement
grep -A 5 "requireRoleMiddleware" src/routes/moderation.ts
# Returns: requireRoleMiddleware("moderator")
```

**Fix:** User must be promoted to moderator role (admin action)

#### 2b. Insufficient Capability
```
User role: "participant"
Endpoint requires: "contribution:create"
  
Lookup: roleCapabilities["participant"] includes "contribution:create"?
  → Check the role mapping in capabilities.ts
  → If missing, user cannot perform action
    ↓
Capability check fails → 403 Forbidden
```

**Check:**
```typescript
// Find what capabilities user has
const userCapabilities = getActorCapabilities({
  role: "participant"
});
// Returns: ["auth:refresh", "auth:logout", ...]

// Check if required capability is included
console.log(userCapabilities.includes("contribution:create"));
// If false → capability missing
```

**Fix:** Role must be updated to include capability, or endpoint requirement must be revised

### Issue 3: "400 Bad Request" on Requests

**Symptoms:**
- Valid request fails with 400
- Error: `{"error": {"code": "VALIDATION_ERROR", "message": "..."}}`

**Root Causes:**

#### 3a. Payload Too Large
```
Client sends request with huge JSON body:
  Content-Length: 150000000 (150MB)
    ↓
Input validation middleware:
  validatePayloadSize(payload, { maxSizeBytes: 102400 })
  → 150MB > 100KB
    ↓
Returns 400: "Request body exceeds maximum size"
```

**Fix:**
```javascript
// Client-side: compress or paginate data
const data = largeArray.slice(0, 100); // Send in batches

// Server-side: adjust limit if needed (rare)
app.use(createInputValidationMiddleware({
  maxPayloadSizeBytes: 1024 * 500 // 500KB if really needed
}));
```

#### 3b. Malformed JSON
```
Client sends invalid JSON:
  POST /api/v1/contributions
  Body: { title: "test", user: undefined }
    ↓
JSON.parse fails
    ↓
Returns 400: "Request body is malformed"
```

**Fix:**
```javascript
// Ensure valid JSON
const body = JSON.stringify({ title: "test" }); // Valid
// NOT: { title: "test", user: undefined } → undefined not valid JSON
```

#### 3c. Dangerous Object Key
```
Client sends request with prototype pollution attempt:
  POST /api/v1/contributions
  Body: { title: "test", "__proto__": { admin: true } }
    ↓
Object structure validation:
  Detects dangerous key "__proto__"
    ↓
Returns 400: "Request contains forbidden field name"
```

**This is expected**: dangerous patterns are rejected at boundary

**Fix:** Don't send dangerous keys (attackers detected + logged)

### Issue 4: "429 Too Many Requests"

**Symptoms:**
- User gets 429 after several requests
- Error: `{"error": {"code": "RATE_LIMITED", "message": "Too many requests"}}`
- Response headers: `Retry-After: 300`

**Root Causes:**

#### 4a. Auth Endpoint Rate Limit
```
User tries to log in 15 times in 5 minutes:
  Policy: auth { maxRequests: 10, windowSeconds: 300 }
    ↓
Request 11-15: rate-limited → 429
    ↓
Response: Retry-After: 300 (try again in 5 min)
```

**Fix:**
```javascript
// Implement exponential backoff on 429
async function loginWithRetry(credentials, maxAttempts = 3) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await login(credentials);
    } catch (error) {
      if (error.status === 429) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

#### 4b. Mutation Endpoint Rate Limit
```
User rapidly creates contributions (spam bot):
  Policy: mutation { maxRequests: 100, windowSeconds: 60 }
    ↓
Request 101+: rate-limited → 429
```

**Fix:** Space out requests (legitimate use should not hit this)

### Issue 5: Session Validation Warnings in Logs

**Symptoms:**
- Logs show warnings like:
  - `Session record has missing required fields`
  - `Session validation failed with suspicious pattern`
  - `Object contains dangerous key`

**These are expected** when:
1. Attacker sends malformed/crafted requests
2. Client bug sends invalid session data
3. Session store corruption (rare)

**Action:**
```
1. Check logs for correlation ID
2. Find request that caused warning
3. If from known bot: add IP to blocklist
4. If from real user: investigate client behavior
5. If suspicious: file security incident
```

## Debugging Procedures

### Procedure 1: Trace Authentication Request

**Scenario:** User reports "can't log in"

**Steps:**

1. **Get correlation ID** (from error response or logs)
   ```javascript
   const response = await fetch("/api/v1/auth/login", { ... });
   const correlationId = response.json().meta?.requestId;
   ```

2. **Query audit trail**
   ```bash
   # Find all events for this request
   grep correlationId <logs> | head -20
   ```

3. **Expected log sequence** (success):
   ```
   [request_correlation] Assigned correlationId: req_abc123
   [request_logging] POST /api/v1/auth/login
   [auth_controller] Validating credentials
   [auth_service] Session created for user123
   [response_logging] 200 OK, responseTime: 45ms
   ```

4. **Expected log sequence** (failure - invalid credentials):
   ```
   [request_correlation] Assigned correlationId: req_abc123
   [request_logging] POST /api/v1/auth/login
   [auth_controller] Validating credentials
   [auth_service] Credentials invalid
   [response_logging] 401 UNAUTHENTICATED, responseTime: 23ms
   ```

### Procedure 2: Trace Authorization Failure

**Scenario:** User reports "permission denied" on specific endpoint

**Steps:**

1. **Get correlation ID** from error response

2. **Query audit trail**
   ```bash
   grep correlationId <logs> | grep "capability\|authorization\|forbidden"
   ```

3. **Expected log sequence**:
   ```
   [request_correlation] Assigned correlationId: req_def456
   [request_logging] POST /api/v1/contributions
   [request_actor] Actor resolved: authenticated, role=user
   [capability_enforcement] Checking capability: contribution:create
   [capability_audit] Capability allowed (user has permission)
   [response_logging] 200 OK
   ```

   **If denied**:
   ```
   [request_correlation] Assigned correlationId: req_def456
   [request_logging] POST /api/v1/moderation/cases
   [request_actor] Actor resolved: authenticated, role=user
   [capability_enforcement] Checking capability: moderation:case:write
   [capability_audit] Capability denied: insufficient_capability
   [response_logging] 403 FORBIDDEN
   ```

### Procedure 3: Debug Token Issues

**Steps:**

1. **Collect information**
   ```bash
   # From client logs
   Token: "atk_550e8400-e29b-41d4-a716-446655440000"
   Sent in: header vs cookie
   
   # From server logs  
   Correlation ID: "req_xyz789"
   Timestamp: "2026-05-26T10:30:45Z"
   ```

2. **Check token format**
   ```bash
   # Token should match: [art]tk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   echo "atk_550e8400-e29b-41d4-a716-446655440000" | \
     grep -E "^[art]tk_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
   # Should match, else format is invalid
   ```

3. **Check session store**
   ```sql
   -- Hash the token to query
   SELECT sha256('atk_550e8400-e29b-41d4-a716-446655440000');
   
   -- Look up session
   SELECT id, user_id, state, issued_at, expires_at, revoked_at
   FROM auth_sessions 
   WHERE access_token_hash = <hash>
   LIMIT 1;
   ```

4. **Check timestamps**
   ```sql
   -- Is session expired?
   SELECT expires_at, NOW() as now,
          (expires_at <= NOW()) as is_expired
   FROM auth_sessions 
   WHERE id = '<session-id>';
   
   -- Is session revoked?
   SELECT revoked_at FROM auth_sessions WHERE id = '<session-id>';
   -- If NULL → not revoked, if timestamp → revoked at that time
   ```

## Security Diagnostics

### Detecting Attacks

**Pattern: Repeated 401 Unauthenticated**
```bash
# Many auth failures from same IP
grep "capability_denial.*unauthenticated" <logs> | 
  grep "clientIp: 192.168.1.1" | 
  wc -l
# If > 50 in 1 hour → possible brute force attempt

# Action: Add IP to rate-limit blocklist
```

**Pattern: Invalid Token Formats**
```bash
# Malformed tokens sent
grep "Token format invalid\|malformed session token" <logs> | 
  wc -l
# If > 10 in 1 hour → possible reconnaissance

# Action: Review logs for patterns, consider WAF rule
```

**Pattern: Prototype Pollution Attempts**
```bash
# Dangerous object keys detected
grep "Dangerous object key\|__proto__\|constructor\|prototype" <logs>
# If found → attacker probing for vulnerabilities

# Action: Verify no actual exploitation, monitor client
```

### Generating Security Reports

```bash
# Auth failures by hour
grep "UNAUTHENTICATED\|session_validation" <logs> |
  awk '{print $1}' |
  sort | uniq -c

# Rate limit violations
grep "rate_limit.*exceeded" <logs> |
  wc -l

# Capability denials
grep "capability_denial" <logs> |
  jq '.requiredCapability' |
  sort | uniq -c

# Suspicious patterns
grep "suspicious_pattern: true\|riskLevel.*high" <logs> |
  wc -l
```

## Recovery Procedures

### Recovery 1: Mass Session Invalidation

**Scenario:** Suspected security breach, need to invalidate all sessions

**Steps:**

1. **Backup current sessions** (if needed)
   ```bash
   pg_dump production_db -t auth_sessions > sessions_backup.sql
   ```

2. **Revoke all sessions**
   ```sql
   UPDATE auth_sessions SET revoked_at = NOW() 
   WHERE revoked_at IS NULL;
   
   -- Verify
   SELECT COUNT(*) as active_sessions FROM auth_sessions 
   WHERE revoked_at IS NULL;
   -- Should be 0
   ```

3. **Notify users** (through out-of-band channel, e.g., email)
   - "We've revoked all sessions for security reasons"
   - "Please log in again"
   - "If you don't have an account, you'll need to register"

4. **Monitor re-authentication**
   ```bash
   # Watch for login spike
   grep "auth:login" <logs> | wc -l
   # Should see normal volume + extra from re-authenticating users
   ```

### Recovery 2: Clear Rate Limit State

**Scenario:** Rate limiter incorrectly blocking legitimate traffic

**Steps:**

1. **Check if in-memory or Redis-backed**
   ```bash
   grep -r "RateLimiter\|redis" src/
   ```

2. **If in-memory** (MVP default):
   ```typescript
   // In server initialization
   rateLimiter.clear(); // Resets all counters
   ```

3. **If Redis**:
   ```bash
   redis-cli FLUSHDB
   # OR selective
   redis-cli DEL rate_limit:*
   ```

4. **Verify** by retrying request:
   ```bash
   curl -v https://api.contriskill.com/auth/login
   # Should succeed (not 429)
   ```

### Recovery 3: Fix Compromised User Account

**Scenario:** User reports account compromise

**Steps:**

1. **Investigate session history**
   ```sql
   SELECT id, issued_at, last_seen_at, revoked_at, client_ip
   FROM auth_sessions
   WHERE user_id = 'compromised_user_id'
   ORDER BY issued_at DESC
   LIMIT 10;
   ```

2. **Identify suspicious sessions** (unusual IP, late-night access, etc.)

3. **Revoke compromised sessions**
   ```sql
   UPDATE auth_sessions 
   SET revoked_at = NOW()
   WHERE user_id = 'compromised_user_id'
     AND issued_at > '2026-05-25 00:00:00';
   ```

4. **Force password reset** (if password compromise suspected)
   ```sql
   UPDATE users 
   SET password_reset_required = true
   WHERE id = 'compromised_user_id';
   ```

5. **Review audit trail** for any malicious actions
   ```bash
   grep "userId: compromised_user_id" <audit_logs> |
     grep -E "contribution|mutation|moderation"
   ```

6. **Communicate with user**
   - Explain what happened
   - Provide reset instructions
   - Check for any unauthorized actions

## Checklist: Before Production Deployment

- [ ] All session TTLs configured for your environment
- [ ] Rate-limit policies tuned to expected traffic
- [ ] Input validation limits appropriate for your API
- [ ] Observability pipeline receives security events
- [ ] Alerts configured for high-risk events
- [ ] HTTPS/TLS enabled for all non-local environments
- [ ] Session cookies have secure, httpOnly flags
- [ ] CORS configured to known origins only
- [ ] Helm/security headers enabled
- [ ] Sensitive data excluded from logs
- [ ] Incident response playbook reviewed with team
- [ ] Rate-limit recovery procedure documented
- [ ] Session invalidation procedure tested
- [ ] Backup/restore of auth state tested
