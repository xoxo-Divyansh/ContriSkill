# Moderation System

- **Purpose:** Define how ContriSkill protects trust, handles abuse, and governs moderation outcomes.
- **Owner:** Product + Trust & Safety + Architecture
- **Status:** Draft
- **Related docs:** `../01-product/contribution-engine.md`, `../02-architecture/api-spec.md`, `../02-architecture/database-design.md`, `../03-engineering/pr-review-checklist.md`, `../05-ai-workflow/ai-review-checklist.md`

## Overview

The moderation system exists to:

- maintain ecosystem trust
- reduce abuse
- protect collaboration quality
- preserve the integrity of credits, reviews, and reputation

This document defines the moderation problem space and baseline governance direction. It is not yet a complete operational policy.

## Abuse Categories

### Spam

Repeated low-quality content or repeated irrelevant actions.

### Fake Collaborations

Artificial contribution farming intended to manipulate credits, visibility, or reputation.

### Harassment

Toxic, abusive, coercive, or unsafe interaction during collaboration or messaging.

### Review Manipulation

Coordinated fake ratings, reciprocal trust inflation, or retaliatory review behavior.

### Duplicate Accounts

Self-boosting through multiple identities, controlled accounts, or suspicious trust rings.

## Moderation States

```text
pending
under_review
action_taken
dismissed
resolved
```

## Moderation Actions

Possible actions include:

- warning
- content removal
- temporary restriction
- reputation penalty
- account suspension

## Future Moderation Expansion

Potential additions:

- AI-assisted moderation
- trust anomaly detection
- automated spam analysis
- reputation fraud detection

## Governance Constraints

- moderation must be explainable
- trust-affecting outcomes must be auditable
- moderation actions must not silently mutate historical records
- enforcement should distinguish between low-quality participation and malicious abuse

## OPEN DECISION

- What evidence types are admissible in disputes?
- What moderator roles and permissions exist in MVP?
- What appeal workflow is required before permanent penalties?
- What actions should trigger automatic temporary restrictions?
- How should moderation interact with credit reversals and reputation adjustments?
