# Notification System

- **Purpose:** Define notification categories, delivery triggers, and future channel expansion for collaboration workflows.
- **Owner:** Product + Architecture
- **Status:** Draft
- **Related docs:** `api-spec.md`, `database-design.md`, `../01-product/contribution-engine.md`, `../01-product/moderation-system.md`

## Notification Triggers

Users should receive notifications when:

- contribution accepted
- message received
- review submitted
- credits earned
- reputation changed
- collaboration completed
- dispute created
- moderation action triggered

## Notification Categories

| Type | Purpose |
| --- | --- |
| system | platform events |
| collaboration | contribution updates |
| reputation | trust changes |
| messaging | communication |
| moderation | safety alerts |

## Future Notification Expansion

Potential additions:

- push notifications
- email digests
- smart reminders
- AI activity summaries

## OPEN DECISION

- Which notifications are mandatory versus user-configurable?
- What delivery channels are required for MVP beyond in-app notifications?
- What unread-state and archival behavior should be stored in the database?
- Which trust-affecting changes require high-priority delivery?
