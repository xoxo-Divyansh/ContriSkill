# API Specification

- **Purpose:** Define the conceptual API surface for the ContriSkill MVP and clarify which domain areas need formal interface contracts before implementation.
- **Owner:** Architecture + Backend
- **Status:** Draft
- **Related docs:** `architecture.md`, `database-design.md`, `../01-product/product-spec.md`, `../01-product/contribution-engine.md`, `../adr/ADR-002-auth-and-session-strategy.md`, `../adr/ADR-003-ledger-and-audit-principles.md`

## 1. API Philosophy

The API architecture is designed to:

- support modular ecosystem growth
- maintain predictable communication
- separate frontend from backend responsibilities

The API layer acts as:

- the communication bridge
- the business logic gateway
- the ecosystem access layer

## 2. API Design Principles

Core principles:

- REST-first architecture
- resource-oriented routes
- predictable response structures
- version-controlled APIs
- secure authenticated access
- scalable modular endpoints

## 3. Authentication APIs

### Register User

```http
POST /api/v1/auth/register
```

Purpose: create a new platform account.

### Login User

```http
POST /api/v1/auth/login
```

Purpose: authenticate an existing user and establish a valid session.

### Logout User

```http
POST /api/v1/auth/logout
```

Purpose: invalidate the active session.

### Refresh Session

```http
POST /api/v1/auth/refresh
```

Purpose: rotate or renew a valid authenticated session.

## 4. User APIs

### Get User Profile

```http
GET /api/v1/users/:id
```

### Update Profile

```http
PATCH /api/v1/users/profile
```

### Get Reputation Data

```http
GET /api/v1/users/reputation
```

## 5. Post APIs

### Create Contribution Post

```http
POST /api/v1/posts/create
```

### Get All Posts

```http
GET /api/v1/posts
```

### Get Single Post

```http
GET /api/v1/posts/:id
```

### Update Post

```http
PATCH /api/v1/posts/:id
```

## 6. Contribution APIs

### Respond to Contribution

```http
POST /api/v1/contributions/respond
```

### Start Collaboration

```http
POST /api/v1/contributions/start
```

### Verify Completion

```http
POST /api/v1/contributions/verify
```

## 7. Messaging APIs

### Send Message

```http
POST /api/v1/messages/send
```

### Get Conversations

```http
GET /api/v1/messages/conversations
```

## 8. Credit APIs

### Get Credit Balance

```http
GET /api/v1/credits/balance
```

### Credit History

```http
GET /api/v1/credits/history
```

## 9. Notification APIs

### Get Notifications

```http
GET /api/v1/notifications
```

### Mark Notification Read

```http
PATCH /api/v1/notifications/:id
```

## 10. Moderation APIs

### Report User or Contribution

```http
POST /api/v1/reports/create
```

### Review Dispute

```http
POST /api/v1/moderation/review
```

## 11. API Security

Security measures:

- authenticated access
- rate limiting
- request validation
- role-based access control
- encrypted credentials
- API versioning

## 12. Future API Expansion

Possible future additions:

- GraphQL layer
- realtime event APIs
- AI recommendation endpoints
- analytics APIs
- decentralized identity APIs

## OPEN DECISION

- Should the final route naming remain `posts` and `contributions`, or be normalized around `posts`, `applications`, and `collaborations`?
- Which endpoints must be idempotent for trust-affecting actions?
- Which actions are synchronous versus background-processed?
- What is the canonical error envelope for API consumers?
- Which moderation and ledger events require explicit API exposure?
