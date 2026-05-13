# Wireframe Notes

- **Purpose:** Define the MVP screen flow and trust-critical UI states for contribution, verification, disputes, and moderation visibility.
- **Owner:** Product Design + Product
- **Status:** Draft
- **Related docs:** `design-system.md`, `../01-product/contribution-engine.md`, `../01-product/moderation-system.md`, `../02-architecture/database-design.md`

## 1. MVP UX Principles

- Show trust context before commitment actions.
- Keep contribution actions simple and state-aware.
- Make verification and dispute paths explicit and unavoidable when needed.
- Surface status transitions clearly to both participants.
- Keep mobile flow optimized for high-frequency actions.

## 2. Canonical MVP Screen Map

### Public and Onboarding

1. landing
2. sign up and login
3. onboarding profile and skills

### Core Contributor Flow

4. dashboard
5. discover feed
6. post details
7. create contribution post
8. collaboration room
9. verification and review modal
10. profile and trust history

### Safety and Governance

11. report flow
12. dispute status flow
13. moderation outcome notification

## 3. Contribution Lifecycle Screen Flow

1. discover feed -> post details -> respond
2. requester accepts -> collaboration room opens
3. collaboration room -> mark complete
4. verification modal opens for both participants
5. outcomes:
- both verify -> review step -> settlement confirmation state
- mismatch or timeout -> dispute state -> moderation pending view

## 4. Screen-Level Requirements

### Dashboard

- show active collaborations grouped by state
- show pending verification actions first
- show trust summary: credits, reputation, completion rate

### Discover Feed

- each card shows:
  - contribution type
  - required skills
  - trust requirement
  - credit expectation
  - current status

### Post Details

- show full requirements and acceptance criteria
- show creator trust context and prior collaboration stats
- show clear respond action and response status

### Collaboration Room

- timeline of collaboration events
- task status and expected deliverables
- message thread
- actions: mark complete, open dispute, report behavior

### Verification and Review Modal

- mandatory verify or reject decision
- rejection requires reason
- review step only after verification resolution policy is satisfied

### Dispute Status View

- dispute reason summary
- current moderation case status
- expected next action and waiting state

## 5. Trust Surfaces in UI

Trust indicators must be visible in:

- contribution cards
- profile header
- post details
- collaboration room header
- verification modal

Minimum trust indicators for MVP:

- reputation score
- completion rate
- verified collaboration count
- recent moderation flags indicator

## 6. MVP Mobile Flow Priorities

- fast access to active collaborations
- quick verification actions
- dispute reporting with minimal steps
- notification-driven navigation into pending actions

## 7. Failure and Edge States

- contributor inactive timeout warning
- verification pending timeout warning
- dispute submitted confirmation
- moderation action applied notification
- collaboration cancelled state with reason

## 8. OPEN DECISION

- Should review submission be blocked until both verification decisions are present?
- How much detail from moderation outcomes should be visible to non-moderator users?
- Should trust requirement filters be on by default in discover feed?
- What is the MVP boundary for profile trust history depth on mobile?
- Should no-show warnings be private, bilateral, or publicly visible in profile trust history?
