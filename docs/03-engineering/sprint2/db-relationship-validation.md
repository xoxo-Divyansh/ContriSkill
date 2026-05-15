# DB Relationship Validation (Sprint 2 Planning)

## Purpose

Validate planned MVP data model relationships before schema implementation.

## Core Entity Relationship Map

- `users` 1:1 `profiles`
- `users` 1:N `posts`
- `posts` 1:N `applications`
- `applications` -> optional accepted `collaborations`
- `collaborations` 1:N `verification_requests`
- `collaborations` 1:N `reviews`
- `users` 1:N `credit_ledger_entries`
- `users` 1:N `reputation_events`
- `moderation_cases` link to polymorphic targets (post/application/collaboration/review/profile/user)
- `audit_logs` append-only across critical actions

## Constraint Validation Needs

- Unique active profile per user.
- One active application per `(postId, applicantUserId)` unless withdrawn/rejected policy allows reapply.
- At most one accepted application per post (if post type is single-collaborator).
- Prevent duplicate settlement events for same collaboration event key.
- Strong foreign keys for lifecycle-linked records.

## Transaction Boundaries

- Accept application + create collaboration must be atomic.
- Verification approval + credit settlement + reputation event must be atomic or saga-managed.
- Moderation decision + reputation adjustment + audit write must be atomic from domain perspective.

## Indexing Concerns (MVP)

- Feed/listing:
  - `posts(status, createdAt desc)`
  - `applications(postId, status, createdAt desc)`
- Actor-scoped views:
  - `applications(applicantUserId, createdAt desc)`
  - `collaborations(ownerUserId|contributorUserId, status)`
- Trust surfaces:
  - `reputation_events(userId, createdAt desc)`
  - `credit_ledger_entries(userId, createdAt desc)`
- Moderation:
  - `moderation_cases(status, createdAt desc)`
  - `audit_logs(actorUserId, createdAt desc)`

## Missing Constraints to Decide

- Cross-entity status consistency checks (e.g., collaboration cannot complete unless verification resolved).
- Soft delete policy and uniqueness behavior with archived rows.
- Idempotency key storage scope for settlement/reputation events.

## OPEN DECISION

- Single-table vs multi-table strategy for moderation targets.
- Ledger balance materialization strategy (derived query vs snapshot cache).
- Hard delete allowance for non-financial/non-audit entities.
