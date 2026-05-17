# Notification Architecture

## Objective

Define reliable notification architecture for contribution lifecycle and trust-affecting events without coupling delivery success to core transaction success.

## Notification Event Sources

- contribution state change events
- application acceptance/rejection
- collaboration transition events
- verification/dispute outcomes
- moderation case updates (policy-filtered visibility)

## Delivery Architecture Direction

- Use async outbox-driven notification generation.
- Notification records persisted before delivery attempts.
- Channel adapters handle transport (in-app, email).

## Channel Boundaries

## In-App Notifications

- Source of truth for product-visible alerts.
- Must preserve unread/read state and actor-specific visibility.

## Email Notifications

- Secondary channel for time-sensitive/summary updates.
- Must obey user preferences and moderation privacy boundaries.

## Retry/Delivery Concerns

- Retry with exponential backoff for transient transport failures.
- Mark terminal failures with reason for operational follow-up.
- Keep dedupe keys to avoid duplicate sends on retried jobs.

## Data Model Direction

- `notifications` table for in-app records.
- `notification_deliveries` table for per-channel attempt history.
- `notification_preferences` table for user channel controls.

## Privacy/Trust Boundaries

- Do not leak restricted moderation details.
- Use role/policy-based template rendering context.
- Redact sensitive payload fields for non-authorized recipients.

## MVP vs Evolution

### MVP/near-term

- in-app notifications + optional baseline email.
- async delivery worker with retries and attempt logs.

### Deferred

- push/mobile channel support.
- notification digest personalization.
- escalation rules based on recipient engagement.

## OPEN_DECISION

1. Which event types are mandatory email in MVP.
2. Initial retry policy and maximum retry count.
3. Whether notification preference defaults differ by role.
