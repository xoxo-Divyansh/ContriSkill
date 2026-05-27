# Capability Enforcement Guide

## Overview

This guide describes the capability-based authorization model for ContriSkill APIs. Capabilities define what actions an authenticated actor can perform in their current role context.

## 1. Capability Model

### 1.1 Capability Definition

A **capability** is a fine-grained permission to perform a specific action:

```typescript
type AuthCapability = 
  | "auth:register"
  | "auth:login"
  | "auth:refresh"
  | "auth:logout"
  | "auth:session:read"
  | "contribution:read"
  | "contribution:create"
  | "contribution:update"
  | "contribution:cancel"
  | "contribution:state:transition"
  | "contribution:application:submit"
  | "contribution:application:accept"
  | "mutation:submit"
  | "draft:sync"
  | "projection:sync"
  | "workspace:session:join"
  | "moderation:case:read"
  | "moderation:case:write"
  | "admin:roles:manage"
```

### 1.2 Capability Format

Capabilities use a hierarchical naming scheme:

```
[domain]:[action]
[domain]:[resource]:[action]
```

Examples:
- `auth:login` - perform login in auth domain
- `contribution:read` - read contribution resource
- `admin:roles:manage` - manage roles in admin domain

### 1.3 Capability Validation

Format validation in `isValidCapabilityFormat()`:

```typescript
// Valid: lowercase alphanumeric + underscore, 2-3 parts separated by colons
"auth:login" ✓
"moderation:case:read" ✓
"contribution_deletion:execute" ✓

// Invalid: uppercase, special chars, wrong separator
"Auth:Login" ✗
"auth.login" ✗
"auth::" ✗
```

## 2. Role-Based Capability Mapping

### 2.1 Role Hierarchy

```typescript
type AuthRole = 
  | "public"      // unauthenticated
  | "user"        // authenticated standard user
  | "participant" // authenticated with contribution context
  | "owner"       // workspace/contribution owner
  | "moderator"   // moderation privileges
  | "admin"       // system administrator
```

### 2.2 Capability-to-Role Mapping

```typescript
const roleCapabilities: Record<AuthRole, readonly AuthCapability[]> = {
  public: ["auth:register", "auth:login"],

  user: [
    "auth:refresh",
    "auth:logout",
    "auth:session:read",
    "contribution:read",
    "contribution:create",
    "contribution:update",
    "contribution:cancel",
    "contribution:state:transition",
    "contribution:application:submit",
    "contribution:application:accept",
    "mutation:submit",
    "draft:sync",
    "projection:sync",
    "workspace:session:join"
  ],

  participant: [/* same as user currently */],

  owner: [/* same as user currently */],

  moderator: [
    // all user capabilities plus:
    "moderation:case:read",
    "moderation:case:write"
  ],

  admin: [
    // all moderator capabilities plus:
    "admin:roles:manage"
  ]
};
```

### 2.3 Capability Inheritance

Roles inherit all capabilities of lower privilege levels:
- `admin` has all `moderator` capabilities + admin capabilities
- `moderator` has all `user` capabilities + moderation capabilities
- `owner` has `user` capabilities (participant-scoped override)
- `participant` has `user` capabilities (context-scoped override)
- `user` has capabilities minus public-only
- `public` has registration/login only

## 3. Enforcing Capabilities

### 3.1 Middleware-Based Enforcement

Use `requireCapabilityMiddleware()` to enforce fine-grained capabilities:

```typescript
import { requireCapabilityMiddleware } from "../middleware/require-capability";

// Protect contribution creation
router.post("/",
  requireCapabilityMiddleware("contribution:create"),
  contributionController.create
);

// Protect moderation endpoint
router.post("/cases/:id/resolve",
  requireCapabilityMiddleware("moderation:case:write"),
  moderationController.resolve
);
```

### 3.2 Authorization Check Flow

When a request hits a capability-protected endpoint:

1. **Middleware receives request** with `request.actor` already set by `createRequestActorMiddleware()`
2. **Actor capabilities determined** by `getActorCapabilities(actor)`
   - Uses actor's role to look up capability set
   - Returns empty array if actor is undefined
   - Returns public capabilities for anonymous actors
3. **Required capability checked** against actor's capability set
4. **Result**: 
   - ✓ Allowed: request proceeds to handler
   - ✗ Denied: 401 Unauthenticated or 403 Forbidden returned

### 3.3 Audit Trail

Every capability check produces an audit event:

```typescript
type CapabilityDenialEvent = {
  timestamp: "2026-05-26T10:30:45Z",
  actor: RequestActor,
  requiredCapability: "contribution:create",
  denyReason: "insufficient_capability",  // or "unauthenticated"
  correlationId: "req_abc123",
  requestPath: "/api/v1/contributions",
  requestMethod: "POST",
  clientIp: "192.168.1.1"
};
```

Logged to observability pipeline for:
- Security incident investigation
- Access pattern analysis
- Compliance auditing

## 4. Authorization vs. Authentication

### 4.1 Authentication Check

```typescript
import { requireAuthMiddleware } from "../middleware/require-auth";

// Ensures actor is logged in
router.get("/session",
  requireAuthMiddleware,
  authController.getSession
);
```

Authentication checks:
- Actor is not anonymous
- Actor has valid, non-expired session
- Returns 401 Unauthorized if failed

### 4.2 Authorization Check

```typescript
router.post("/contributions/:id/submit-application",
  requireCapabilityMiddleware("contribution:application:submit"),
  contributionController.submitApplication
);
```

Authorization checks:
- Actor has capability (implicitly authenticated first)
- Returns 403 Forbidden if actor lacks capability
- Returns 401 Unauthenticated if actor not logged in

### 4.3 Authorization vs. Authentication Responses

```
401 Unauthenticated:
- Actor not logged in
- Session expired
- Token invalid
- When: capability check fails because actor has no session

403 Forbidden:
- Actor is logged in
- But lacks required capability
- Role insufficient for resource
- When: capability check fails because actor's role excluded
```

## 5. Common Authorization Patterns

### 5.1 Public Operations

No authorization required - anyone can call:

```typescript
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
```

### 5.2 Authenticated-Only Operations

Require login, any role permitted:

```typescript
router.get("/session",
  requireAuthMiddleware,
  authController.getSession
);
```

### 5.3 Capability-Based Operations

Require specific capability:

```typescript
router.post("/contributions",
  requireCapabilityMiddleware("contribution:create"),
  contributionController.create
);
```

### 5.4 Role-Based Operations

Require minimum role:

```typescript
import { requireRoleMiddleware } from "../middleware/require-role";

router.post("/admin/users/:id/assign-role",
  requireRoleMiddleware("admin"),
  adminController.assignRole
);
```

### 5.5 Combined Authorization

Multiple protection layers:

```typescript
// Only mods+ can moderate, must have specific capability
router.post("/moderation/cases/:id/resolve",
  requireAuthMiddleware,                           // must be logged in
  requireRoleMiddleware("moderator"),              // must be moderator+
  requireCapabilityMiddleware("moderation:case:write"), // must have capability
  moderationController.resolve
);
```

## 6. Resource-Level Authorization

### 6.1 Ownership Check Pattern

For resource-specific authorization (e.g., only contribution owner can update):

```typescript
async function updateContribution(request: Request, response: Response) {
  const { id } = request.params;
  const actor = request.actor!; // already authenticated

  // Check capability (user-level permission)
  const canUpdate = actor.role !== "public"; // simplified example
  if (!canUpdate) {
    return response.status(403).json({
      error: { code: "FORBIDDEN", message: "You cannot update contributions" }
    });
  }

  // Fetch resource
  const contribution = await contributionService.getById(id);
  if (!contribution) {
    return response.status(404).json({
      error: { code: "NOT_FOUND", message: "Contribution not found" }
    });
  }

  // Check ownership
  if (contribution.createdBy !== actor.userId) {
    return response.status(403).json({
      error: { 
        code: "FORBIDDEN", 
        message: "You can only update your own contributions" 
      }
    });
  }

  // Perform update
  const updated = await contributionService.update(id, request.body);
  response.json(updated);
}
```

### 6.2 Audit Trail for Resource Access

```typescript
log("info", "Resource access decision", {
  correlationId: request.correlationId,
  actor: { userId: actor.userId, role: actor.role },
  resource: { type: "contribution", id },
  decision: "allowed" | "denied",
  reason: "owner_match" | "role_insufficient" | "resource_not_found"
});
```

## 7. Testing Authorization

### 7.1 Unit Test Pattern

```typescript
import { describe, it, expect } from "vitest";
import { getActorCapabilities } from "../src/modules/auth/capabilities";

describe("capability enforcement", () => {
  it("public actor lacks contribution:create", () => {
    const capabilities = getActorCapabilities({
      actorType: "anonymous",
      role: "public",
      sessionState: "anonymous"
    });
    expect(capabilities).not.toContain("contribution:create");
  });

  it("user actor has contribution:create", () => {
    const capabilities = getActorCapabilities({
      actorType: "authenticated",
      role: "user",
      sessionState: "authenticated",
      userId: "user123"
    });
    expect(capabilities).toContain("contribution:create");
  });

  it("moderator has moderation:case:write", () => {
    const capabilities = getActorCapabilities({
      actorType: "authenticated",
      role: "moderator",
      sessionState: "authenticated",
      userId: "mod456"
    });
    expect(capabilities).toContain("moderation:case:write");
  });
});
```

### 7.2 Integration Test Pattern

```typescript
it("POST /contributions requires contribution:create capability", async () => {
  // Anonymous user gets 401
  const res1 = await request(app)
    .post("/api/v1/contributions")
    .send({ title: "Test" })
    .expect(401);

  // Authenticated user with capability succeeds
  const session = await createSession({ role: "user" });
  const res2 = await request(app)
    .post("/api/v1/contributions")
    .set("x-session-token", session.accessToken)
    .send({ title: "Test" })
    .expect(200);

  // Verify audit event logged
  const auditLog = await auditLogService.getLatest();
  expect(auditLog).toMatchObject({
    action: "contribution:create",
    decision: "allowed",
    actor: { userId: session.userId }
  });
});
```

## 8. Common Mistakes

### 8.1 Missing Server-Side Checks

❌ **DON'T**: Rely on frontend hiding UI for authorization

```typescript
// BAD: No server-side check
router.delete("/contributions/:id", async (req, res) => {
  const id = req.params.id;
  await db.contributions.delete(id);
  res.json({ deleted: true });
});
```

✓ **DO**: Always check server-side

```typescript
// GOOD: Server validates every delete
router.delete("/contributions/:id",
  requireCapabilityMiddleware("contribution:cancel"),
  requireOwnershipMiddleware("contribution"),
  async (req, res) => {
    const id = req.params.id;
    await db.contributions.delete(id);
    res.json({ deleted: true });
  }
);
```

### 8.2 Trusting Unvalidated Headers

❌ **DON'T**: Trust client-supplied role/permission headers

```typescript
// BAD: Trusting x-actor-role header directly
const role = req.headers["x-actor-role"] || "user";
if (role === "admin") {
  // grant admin access
}
```

✓ **DO**: Derive permissions from session only

```typescript
// GOOD: Role comes from validated session
const session = await sessionStore.resolveByAccessToken(token);
const role = session?.role || "public";
```

### 8.3 Confusing Authentication and Authorization

❌ **DON'T**: Mix auth and authz checks

```typescript
// BAD: Unclear what's being checked
async function checkPermission(actor) {
  if (!actor) throw new Error("FORBIDDEN");
  if (actor.role !== "admin") throw new Error("FORBIDDEN");
}
```

✓ **DO**: Separate concerns

```typescript
// GOOD: Clear distinction
async function requireAuth(actor) {
  if (!actor || actor.actorType !== "authenticated") {
    throw new AuthenticationError("Must be logged in");
  }
}

async function requireCapability(actor, capability) {
  if (!canActor(actor, capability)) {
    throw new AuthorizationError("Insufficient permission");
  }
}
```

## 9. Capability Audit Trail

### 9.1 Analyzing Capability Events

Query observability system for:

```
# All capability denials in last hour
capability_denial where timestamp > now() - 1h

# Failed auth attempts by IP
auth_failure where denyReason = "unauthenticated"
  group by clientIp
  order by count desc

# Repeated capability denials from user
capability_denial where actor.userId = "user123"
  group by requiredCapability
  order by count desc
```

### 9.2 Incident Response

When investigating unauthorized access:

1. **Identify correlation ID** from security alert or user report
2. **Find request in audit trail**: `correlationId = <id>`
3. **Trace full request path**:
   - What capabilities were required?
   - What was the actor's role?
   - Did checks fail or pass?
4. **Review session**: Was session valid? Token not compromised?
5. **Check for patterns**: Repeated attempts from same actor/IP?

## 10. Migration Guide

When adding new capabilities:

1. **Define capability** in `authCapabilities` constant
2. **Add to role mapping** in `roleCapabilities`
3. **Protect endpoint** with `requireCapabilityMiddleware()`
4. **Add tests** for the new capability check
5. **Deploy** and monitor audit trail
6. **Adjust limits** based on observed usage

Example:

```typescript
// 1. Define
export const authCapabilities = [
  // ... existing
  "contribution:archive"  // NEW
] as const;

// 2. Map to role (e.g., owners can archive)
const roleCapabilities: Record<AuthRole, readonly AuthCapability[]> = {
  // ...
  owner: [
    // ... existing
    "contribution:archive"  // NEW
  ]
};

// 3. Protect endpoint
router.post("/contributions/:id/archive",
  requireCapabilityMiddleware("contribution:archive"),
  contributionController.archive
);

// 4. Test
it("owner can archive contribution", () => { /* ... */ });
it("non-owner cannot archive", () => { /* ... */ });

// 5. Deploy and monitor
```

## References

- [security-hardening-implementation.md](security-hardening-implementation.md) - Technical implementation
- [auth-session-runbook.md](auth-session-runbook.md) - Troubleshooting
