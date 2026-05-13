# API Specification

- **Purpose:** Define MVP API contracts aligned with the trust model in contribution lifecycle, ledger-based credits, reputation events, verification/dispute handling, moderation, and auditability.
- **Owner:** Architecture + Backend
- **Status:** Draft
- **Related docs:** `architecture.md`, `database-design.md`, `../01-product/contribution-engine.md`, `../04-design/wireframe-notes.md`, `../adr/ADR-002-auth-and-session-strategy.md`, `../adr/ADR-003-ledger-and-audit-principles.md`

## 1. API Scope and Principles

- API style: REST over HTTPS with versioned routes (`/api/v1`).
- Trust-affecting actions must be idempotent where practical.
- State transitions must be validated server-side against canonical lifecycle rules.
- Credit and reputation values are returned as derived views; source-of-truth is event/ledger history.
- All moderation and trust-impacting mutations must produce audit history.

## 2. Common Contracts

### 2.1 Standard Response Envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-13T10:00:00Z"
  }
}
```

### 2.2 Standard Error Envelope

```json
{
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Collaboration is not in a state that allows this action.",
    "details": {
      "currentState": "disputed",
      "expectedState": "awaiting_verification"
    }
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-13T10:00:00Z"
  }
}
```

### 2.3 Core Error Codes

- `UNAUTHENTICATED` (`401`)
- `FORBIDDEN` (`403`)
- `NOT_FOUND` (`404`)
- `VALIDATION_ERROR` (`422`)
- `STATE_CONFLICT` (`409`)
- `RATE_LIMITED` (`429`)
- `IDEMPOTENCY_CONFLICT` (`409`)
- `MODERATION_LOCKED` (`423`)

## 3. Authorization Model (MVP)

- `public`: no auth required
- `user`: authenticated account
- `participant`: authenticated user who is a participant in the collaboration
- `owner`: resource owner (for example post creator)
- `moderator`: moderator role only
- `admin`: administrative platform role

Every endpoint below includes a minimum required role.

## 4. API Groups

## 4.1 Auth APIs

Authorization: `public` for register/login, `user` for logout/refresh.

### `POST /api/v1/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "username": "contributor01",
  "password": "StrongPassword123!"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "usr_1",
      "email": "user@example.com",
      "username": "contributor01",
      "status": "active"
    }
  }
}
```

### `POST /api/v1/auth/login`

### `POST /api/v1/auth/logout`

### `POST /api/v1/auth/refresh`

## 4.2 User APIs

Authorization: `user` for self endpoints, `public` for allowed public profile reads.

### `GET /api/v1/users/:userId`

Purpose: public profile and trust summary.

### `PATCH /api/v1/users/me/profile`

Purpose: update own profile.

### `GET /api/v1/users/me/reputation`

Purpose: view own reputation snapshot and recent event summary.

Response example:

```json
{
  "data": {
    "snapshot": {
      "score": 74,
      "completionRate": 0.92,
      "reviewQualityScore": 4.7
    },
    "recentEvents": [
      {
        "eventType": "COLLAB_COMPLETED",
        "delta": 3,
        "sourceType": "collaboration",
        "sourceId": "col_22"
      }
    ]
  }
}
```

## 4.3 Post APIs

Authorization: `user` for create/respond list access, `owner` for owner-only updates.

### `POST /api/v1/posts`

Purpose: create contribution post in `open` state.

Request:

```json
{
  "postType": "mentorship",
  "title": "Need help with auth flow",
  "description": "Need one async mentoring session.",
  "difficulty": "medium",
  "creditOffer": 50,
  "requirements": [
    {
      "skillId": "sk_auth",
      "minimumReputation": 40
    }
  ]
}
```

Response:

```json
{
  "data": {
    "post": {
      "id": "post_1",
      "status": "open"
    }
  }
}
```

### `GET /api/v1/posts`

Purpose: discover feed.

### `GET /api/v1/posts/:postId`

Purpose: post details.

### `PATCH /api/v1/posts/:postId`

Purpose: owner edits while still mutable.

State conflicts:

- return `409 STATE_CONFLICT` when post is already `accepted`, `cancelled`, `expired`, or under moderation lock.

## 4.4 Application APIs

Authorization: `user` to apply, `owner` to review and accept.

Applications map to `post_responses`.

### `POST /api/v1/posts/:postId/applications`

Purpose: respond to a post (`open` or `in_review` only).

Request:

```json
{
  "message": "I can help with this auth implementation review."
}
```

Response:

```json
{
  "data": {
    "application": {
      "id": "app_11",
      "status": "pending",
      "postId": "post_1",
      "responderUserId": "usr_2"
    }
  }
}
```

### `GET /api/v1/posts/:postId/applications`

Purpose: owner views candidates.

### `POST /api/v1/posts/:postId/applications/:applicationId/accept`

Purpose: accept one application and trigger collaboration creation.

State conflicts:

- `409 STATE_CONFLICT` if post not in `open` or `in_review`.
- `409 STATE_CONFLICT` if post already has accepted application.

## 4.5 Collaboration APIs

Authorization: `participant` for participant actions, `owner` for requester cancel rules.

Collaborations map to lifecycle states:

- `pending -> active -> awaiting_verification -> verified`
- `awaiting_verification -> disputed`
- `any -> cancelled/failed/under_moderation` per governance rules

### `POST /api/v1/collaborations`

Purpose: create collaboration from accepted application.

### `GET /api/v1/collaborations/:collaborationId`

Purpose: collaboration detail including current state.

### `POST /api/v1/collaborations/:collaborationId/start`

Purpose: transition `pending -> active`.

### `POST /api/v1/collaborations/:collaborationId/mark-complete`

Purpose: mark work complete and transition `active -> awaiting_verification`.

### `POST /api/v1/collaborations/:collaborationId/cancel`

Purpose: cancel under allowed policy conditions.

State conflicts:

- `409 STATE_CONFLICT` when requested transition is invalid from current state.
- `423 MODERATION_LOCKED` when collaboration is in `under_moderation`.

## 4.6 Verification APIs

Authorization: `participant`.

### `POST /api/v1/collaborations/:collaborationId/verification-requests`

Purpose: open verification request from `awaiting_verification`.

### `POST /api/v1/verification-requests/:verificationRequestId/decisions`

Purpose: submit participant decision (`verify` or `reject`).

Request:

```json
{
  "decision": "reject",
  "reason": "Deliverable incomplete"
}
```

Response:

```json
{
  "data": {
    "verificationRequestId": "vr_9",
    "collaborationState": "disputed",
    "resolution": "mismatch"
  }
}
```

Transition outcomes:

- both `verify` -> collaboration `verified`
- any mismatch -> collaboration `disputed`
- timeout policy may auto-transition to `disputed` or `cancelled`

## 4.7 Review APIs

Authorization: `participant`.

### `POST /api/v1/collaborations/:collaborationId/reviews`

Purpose: submit bilateral review according to verification policy.

Request:

```json
{
  "revieweeUserId": "usr_2",
  "rating": 5,
  "comment": "Clear guidance and reliable collaboration."
}
```

Response:

```json
{
  "data": {
    "review": {
      "id": "rev_1",
      "collaborationId": "col_22"
    }
  }
}
```

State conflicts:

- `409 STATE_CONFLICT` if review window not open per verification policy.
- `409 STATE_CONFLICT` on duplicate reviewer->reviewee review for same collaboration.

## 4.8 Credits APIs

Authorization: `user` for own data, `admin` for manual adjustments.

### `GET /api/v1/credits/me/balance`

### `GET /api/v1/credits/me/ledger`

Purpose: read derived balance and append-only history.

Response example:

```json
{
  "data": {
    "balance": 240,
    "entries": [
      {
        "id": "cle_1",
        "entryType": "EARN",
        "amount": 50,
        "sourceType": "collaboration",
        "sourceId": "col_22"
      }
    ]
  }
}
```

### `POST /api/v1/credits/adjustments`

Purpose: controlled manual adjustment with audit trail.

Authorization: `admin`.

State and conflict rules:

- trust-affecting writes require idempotency key header.
- duplicate key with different payload returns `409 IDEMPOTENCY_CONFLICT`.

## 4.9 Reputation APIs

Authorization: `user` for self, `public` for profile-level views.

### `GET /api/v1/reputation/users/:userId/snapshot`

### `GET /api/v1/reputation/users/:userId/events`

Purpose: expose trust summary and explainability trail.

Note: event stream may be permission-filtered for privacy.

## 4.10 Moderation APIs

Authorization: `user` for report creation, `moderator` for case handling.

### `POST /api/v1/reports`

Purpose: create abuse/dispute report.

Request:

```json
{
  "subjectType": "collaboration",
  "subjectId": "col_22",
  "reasonCode": "fake_collaboration",
  "details": "Deliverables were fabricated."
}
```

### `GET /api/v1/moderation/cases/:caseId`

Authorization: `moderator`.

### `POST /api/v1/moderation/cases/:caseId/actions`

Purpose: apply moderation action with audit references.

Request:

```json
{
  "actionType": "reputation_penalty",
  "targetUserId": "usr_2",
  "reason": "Confirmed trust manipulation"
}
```

Response:

```json
{
  "data": {
    "caseId": "mc_7",
    "actionId": "ma_19",
    "status": "action_taken"
  }
}
```

## 4.11 Notifications APIs

Authorization: `user`.

### `GET /api/v1/notifications`

Purpose: list in-app notifications for collaboration, trust, and moderation events.

### `PATCH /api/v1/notifications/:notificationId/read`

Purpose: mark notification read.

## 4.12 Audit History APIs

Authorization: `moderator` for case-linked audit reads, `admin` for broad audit access.

### `GET /api/v1/audit/history`

Purpose: query immutable governance events with filters.

Example query parameters:

- `entityType`
- `entityId`
- `actorUserId`
- `from`
- `to`

Response example:

```json
{
  "data": {
    "events": [
      {
        "id": "audit_1",
        "action": "MODERATION_ACTION_APPLIED",
        "entityType": "moderation_case",
        "entityId": "mc_7",
        "actorUserId": "usr_mod_1",
        "timestamp": "2026-05-13T09:45:00Z"
      }
    ]
  }
}
```

## 5. Lifecycle Transition Coverage Matrix

1. post created -> `POST /posts`
2. contributor responds -> `POST /posts/:postId/applications`
3. requester accepts response -> `POST /posts/:postId/applications/:applicationId/accept`
4. collaboration starts -> `POST /collaborations/:id/start`
5. work marked complete -> `POST /collaborations/:id/mark-complete`
6. verification requested -> `POST /collaborations/:id/verification-requests`
7. verification decided -> `POST /verification-requests/:id/decisions`
8. reviews submitted -> `POST /collaborations/:id/reviews`
9. credits settled -> system side effects surfaced via `GET /credits/me/ledger`
10. reputation events written -> surfaced via `GET /reputation/users/:userId/events`
11. disputes reported -> `POST /reports`
12. moderation action issued -> `POST /moderation/cases/:caseId/actions`
13. audit trace available -> `GET /audit/history`

## 6. State Conflict and Integrity Rules

- Any invalid lifecycle transition returns `409 STATE_CONFLICT`.
- Any action on missing resource returns `404 NOT_FOUND`.
- Any action by non-participant on collaboration-bound endpoints returns `403 FORBIDDEN`.
- Any trust-affecting duplicate request with same idempotency key and same payload returns previous success response.
- Any trust-affecting duplicate request with same key and different payload returns `409 IDEMPOTENCY_CONFLICT`.
- Collaborations in `under_moderation` return `423 MODERATION_LOCKED` for normal participant transitions.

## 7. OPEN DECISION

- Should review submission be allowed before both verification decisions are present?
- What exact timeout policy auto-transitions verification to `disputed` or `cancelled`?
- Should moderation case visibility be partially exposed to involved participants?
- Which reputation events are publicly visible versus private?
- Is `POST /collaborations` client-callable, or strictly internal after application acceptance?
- Should audit history include participant-visible redacted views in MVP?
