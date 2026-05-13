# Database Design

- **Purpose:** Define the canonical data model, relational boundaries, ledger structures, and auditability requirements for ContriSkill.
- **Owner:** Architecture + Data
- **Status:** Placeholder — OPEN DECISION
- **What this document must define:**
  - core entities and their ownership boundaries
  - relationship model for posts, collaborations, reviews, verification, moderation, and notifications
  - append-only ledger strategy for credits and reputation
  - indexing and query strategy for feeds, messaging, and trust history
  - audit logging, retention, and privacy boundaries
  - migration and schema governance rules
- **Related docs:** `architecture.md`, `api-spec.md`, `../01-product/contribution-engine.md`, `../01-product/moderation-system.md`, `../adr/ADR-003-ledger-and-audit-principles.md`

## Placeholder Notes

This document intentionally avoids inventing a finalized schema before the following domain rules are formally decided:

- exact credit issuance and spending mechanics
- reputation calculation inputs and weighting
- verification and dispute evidence rules
- moderator action history and reversal policy
- notification persistence and delivery guarantees

## OPEN DECISION

- What is the minimum entity set required for MVP without collapsing auditability?
- Which records are append-only versus mutable snapshots?
- Should trust score snapshots be materialized or computed on read?
- What data retention policy applies to messages, reports, and moderation evidence?
