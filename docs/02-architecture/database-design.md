# Database Design

- **Purpose:** Define the canonical MVP entity model and data governance rules for contribution, trust, credits, reputation, verification, disputes, and moderation.
- **Owner:** Architecture + Data
- **Status:** Draft
- **Related docs:** `architecture.md`, `api-spec.md`, `../01-product/contribution-engine.md`, `../01-product/moderation-system.md`, `../04-design/wireframe-notes.md`, `../adr/ADR-003-ledger-and-audit-principles.md`

## 1. MVP Data Principles

- Keep the MVP relational and audit-friendly.
- Store trust-affecting changes as append-only events.
- Separate mutable workflow state from immutable ledger history.
- Keep moderation evidence and actions traceable.
- Prefer explicit foreign keys over implicit references.

## 2. Canonical MVP Entity Model

### Identity and Profile

1. `users`
- Purpose: account identity and lifecycle.
- Core fields: `id`, `email`, `username`, `password_hash`, `status`, `created_at`.

2. `profiles`
- Purpose: public contributor identity.
- Core fields: `user_id`, `display_name`, `bio`, `avatar_url`, `experience_level`.

3. `skills`
- Purpose: normalized skill catalog.
- Core fields: `id`, `name`, `category`, `is_active`.

4. `user_skills`
- Purpose: user skill tagging.
- Core fields: `user_id`, `skill_id`, `level`, `is_verified`.

### Contribution and Collaboration

5. `posts`
- Purpose: help request, mentorship, collaboration offer.
- Core fields: `id`, `creator_user_id`, `post_type`, `title`, `description`, `difficulty`, `status`, `credit_offer`, `created_at`.

6. `post_requirements`
- Purpose: skill and trust requirements for a post.
- Core fields: `id`, `post_id`, `skill_id`, `minimum_reputation`, `notes`.

7. `post_responses`
- Purpose: candidate responses to a post.
- Core fields: `id`, `post_id`, `responder_user_id`, `message`, `status`, `created_at`.

8. `collaborations`
- Purpose: accepted contribution agreement.
- Core fields: `id`, `post_id`, `requester_user_id`, `contributor_user_id`, `status`, `started_at`, `completed_at`.

9. `collaboration_events`
- Purpose: immutable timeline of collaboration state changes.
- Core fields: `id`, `collaboration_id`, `event_type`, `event_actor_user_id`, `payload_json`, `created_at`.

10. `messages`
- Purpose: collaboration conversation history.
- Core fields: `id`, `collaboration_id`, `sender_user_id`, `body`, `created_at`.

### Verification, Reviews, and Trust

11. `verification_requests`
- Purpose: completion verification handshake.
- Core fields: `id`, `collaboration_id`, `requested_by_user_id`, `status`, `requested_at`, `resolved_at`.

12. `verification_decisions`
- Purpose: per-participant verify or reject decision.
- Core fields: `id`, `verification_request_id`, `user_id`, `decision`, `reason`, `created_at`.

13. `reviews`
- Purpose: structured bilateral feedback.
- Core fields: `id`, `collaboration_id`, `reviewer_user_id`, `reviewee_user_id`, `rating`, `comment`, `created_at`.

14. `reputation_events`
- Purpose: immutable reputation deltas and reasons.
- Core fields: `id`, `user_id`, `event_type`, `delta`, `source_type`, `source_id`, `created_at`.

15. `reputation_snapshots`
- Purpose: query-optimized current reputation state.
- Core fields: `user_id`, `score`, `completion_rate`, `review_quality_score`, `updated_at`.

### Credits and Moderation

16. `credit_ledger_entries`
- Purpose: append-only credit accounting.
- Core fields: `id`, `user_id`, `entry_type`, `amount`, `balance_after`, `source_type`, `source_id`, `idempotency_key`, `created_at`.

17. `credit_holds`
- Purpose: escrow-like reservation before final settlement.
- Core fields: `id`, `collaboration_id`, `payer_user_id`, `payee_user_id`, `amount`, `status`, `created_at`, `released_at`.

18. `reports`
- Purpose: abuse and dispute reporting intake.
- Core fields: `id`, `reporter_user_id`, `subject_type`, `subject_id`, `reason_code`, `details`, `status`, `created_at`.

19. `moderation_cases`
- Purpose: track moderation investigation.
- Core fields: `id`, `report_id`, `status`, `priority`, `assigned_moderator_user_id`, `opened_at`, `closed_at`.

20. `moderation_actions`
- Purpose: enforceable action log.
- Core fields: `id`, `moderation_case_id`, `action_type`, `target_user_id`, `actor_user_id`, `reason`, `created_at`.

21. `moderation_evidence`
- Purpose: evidence objects tied to a case.
- Core fields: `id`, `moderation_case_id`, `evidence_type`, `reference_id`, `notes`, `created_at`.

22. `audit_log`
- Purpose: immutable platform governance trail for sensitive operations.
- Core fields: `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata_json`, `created_at`.

## 3. Contribution Lifecycle Data Flow

1. `posts` created in `open` state.
2. candidate entries added to `post_responses`.
3. accepted response creates one `collaborations` record.
4. collaboration state changes recorded in `collaboration_events`.
5. completion creates `verification_requests`.
6. decisions recorded in `verification_decisions`.
7. successful verification writes:
- `reviews`
- `credit_ledger_entries`
- `reputation_events`
8. disputes generate `reports`, then `moderation_cases`, `moderation_actions`, and `audit_log`.

## 4. Credit Ledger Rules (MVP)

- Credits are not mutable counters; they are derived from `credit_ledger_entries`.
- Every credit event requires a `source_type` and `source_id`.
- Entry types for MVP:
  - `EARN`
  - `SPEND`
  - `HOLD`
  - `RELEASE`
  - `REVERSAL`
  - `PENALTY`
  - `MANUAL_ADJUSTMENT`
- Collaboration settlement rule:
  - place `HOLD` at collaboration acceptance when payer model applies
  - write `RELEASE` and `EARN` only after successful verification
  - write `REVERSAL` if dispute outcome invalidates prior settlement
- Duplicate protection:
  - enforce unique `idempotency_key` per ledger write intent.

## 5. Reputation Event Rules (MVP)

- Reputation is computed from `reputation_events` and exposed via `reputation_snapshots`.
- Event types for MVP:
  - `COLLAB_COMPLETED`
  - `POSITIVE_REVIEW`
  - `NEGATIVE_REVIEW`
  - `NO_SHOW`
  - `DISPUTE_LOSS`
  - `ABUSE_CONFIRMED`
  - `MODERATOR_ADJUSTMENT`
- Each event must include:
  - `source_type`
  - `source_id`
  - `delta`
  - creation timestamp
- Reputation adjustments resulting from moderation must also be mirrored in `audit_log`.

## 6. Verification and Dispute Data Flow

1. either participant opens `verification_requests`.
2. both parties submit `verification_decisions`.
3. outcomes:
- both verify -> `verified`
- one reject and one verify -> `disputed`
- timeout -> `disputed` or `cancelled` based on policy
4. disputed items create `reports` and `moderation_cases`.
5. moderation outcome writes:
- `moderation_actions`
- optional `credit_ledger_entries` reversal entries
- optional `reputation_events` adjustment entries
- mandatory `audit_log` entry.

## 7. Moderation Audit Trail Requirements

- Every moderation action must have actor, target, reason, and timestamp.
- Evidence references must be preserved in `moderation_evidence`.
- Trust-impacting actions must generate matching `audit_log` rows.
- Case closure requires a final decision note and disposition reason.

## 8. Indexing Baseline (MVP)

- `posts(status, created_at)`
- `posts(post_type, difficulty, created_at)`
- `post_responses(post_id, status, created_at)`
- `collaborations(status, started_at)`
- `collaborations(requester_user_id, status)`
- `collaborations(contributor_user_id, status)`
- `credit_ledger_entries(user_id, created_at)`
- `credit_ledger_entries(idempotency_key)` unique
- `reputation_events(user_id, created_at)`
- `verification_requests(collaboration_id, status)`
- `reports(subject_type, subject_id, status)`
- `moderation_cases(status, priority, opened_at)`
- `audit_log(entity_type, entity_id, created_at)`

## 9. OPEN DECISION

- Is the MVP credit model payer-funded, platform-issued, or hybrid?
- Are credit holds mandatory for all collaboration types or only paid mentorship flows?
- What timeout threshold converts verification to dispute?
- Should low-severity moderation actions alter reputation immediately or only after repeat violations?
- What retention window applies to messages and moderation evidence in MVP?
