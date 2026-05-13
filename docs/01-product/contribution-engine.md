# Contribution Engine

- **Purpose:** Define the MVP contribution lifecycle and trust mechanics across collaboration, credits, reputation, verification, disputes, and moderation.
- **Owner:** Product + Architecture
- **Status:** Draft
- **Related docs:** `product-spec.md`, `moderation-system.md`, `../02-architecture/database-design.md`, `../02-architecture/api-spec.md`, `../adr/ADR-003-ledger-and-audit-principles.md`

## 1. Engine Principles

- Contribution quality is more important than activity volume.
- Verification is required before trust rewards are finalized.
- Credits are utility signals, not financial assets.
- Reputation should be event-based and explainable.
- Moderation outcomes must be auditable and reversible through explicit events.

## 2. Canonical MVP Contribution Types

- Mentorship contribution
- Collaboration contribution
- Problem-solving contribution
- Educational contribution
- Community safety contribution

Each contribution type maps into one shared lifecycle model so trust rules remain consistent.

## 3. Canonical Contribution Lifecycle

1. post created
2. contributor responds
3. requester accepts response
4. collaboration starts
5. work marked complete
6. verification requested
7. verification resolved as verified or disputed
8. reviews submitted
9. credit ledger settled
10. reputation events written

## 4. Lifecycle States

### Post States

- `open`
- `in_review`
- `accepted`
- `in_progress`
- `completed`
- `verified`
- `disputed`
- `cancelled`
- `expired`

### Collaboration States

- `pending`
- `active`
- `awaiting_verification`
- `verified`
- `disputed`
- `failed`
- `cancelled`
- `under_moderation`

### State Transition Guardrails

- `open -> accepted` requires at least one valid response.
- `in_progress -> completed` requires a completion signal from one participant.
- `completed -> verified` requires both participants to verify.
- `completed -> disputed` occurs when participant decisions conflict or timeout policy triggers.
- `under_moderation` blocks normal settlement until case resolution.

## 5. Credit Ledger Rules (MVP)

Credits are managed through append-only ledger entries.

### Allowed Entry Types

- `HOLD`
- `RELEASE`
- `EARN`
- `SPEND`
- `REVERSAL`
- `PENALTY`
- `MANUAL_ADJUSTMENT`

### Settlement Rules

- If the collaboration type requires payment, place a `HOLD` on acceptance.
- On successful verification:
  - release hold
  - write `EARN` for the contributor
  - write corresponding debit path (`SPEND` or release accounting event) for payer model
- On disputed outcome:
  - no positive settlement until moderation decision
  - use `REVERSAL` only for already-applied entries
- Every ledger mutation must carry an idempotency key and source reference.

## 6. Reputation Event Rules (MVP)

Reputation changes are written as events, then aggregated into a visible score.

### Event Types

- `COLLAB_COMPLETED`
- `POSITIVE_REVIEW`
- `NEGATIVE_REVIEW`
- `NO_SHOW`
- `DISPUTE_LOSS`
- `ABUSE_CONFIRMED`
- `MODERATOR_ADJUSTMENT`

### Event Rules

- Each event stores source entity and actor context.
- Multiple events can be created from one collaboration outcome.
- Moderator-driven events require an audit trail reference.
- Snapshot score is a derived view, not the source of truth.

## 7. Verification and Dispute Flow

### Verification Flow

1. participant marks collaboration complete
2. verification request opened
3. both participants submit verify/reject decisions
4. outcomes:
- both verify -> collaboration verified
- mismatch -> collaboration disputed
- timeout -> disputed or cancelled based on policy

### Dispute Flow

1. dispute creates a report
2. moderation case opens
3. evidence collected
4. moderator decision issued
5. ledger and reputation adjustments applied through explicit events
6. case closure logged in audit trail

## 8. Moderation Audit Trail Rules

- Every dispute must map to a moderation case ID.
- Every moderation action must include actor, reason, and timestamp.
- Credit or reputation changes resulting from moderation must reference the case.
- Closed cases require a disposition note.

## 9. Abuse Resistance in MVP

- Rate limits for posting, responses, and reviews.
- Suspicious loop detection for repeated same-pair settlements.
- Trust weighting on reviews from established contributors.
- No settlement finalization before verification resolution.
- Escalation to moderation for repeated no-show or review manipulation patterns.

## 10. OPEN DECISION

- What exact credit formula should map difficulty and quality to payout?
- Should both participants always be allowed to review, or only after bilateral verification?
- What no-show timeout value is fair for mentorship versus async collaboration?
- Should negative events decay over time, or remain fully persistent?
- What moderation severity levels trigger automatic temporary restrictions?
