# Phase 1 MVP Execution Plan

- **Purpose:** Translate ContriSkill architecture and governance documents into a step-by-step Phase 1 implementation roadmap that engineering branches can execute.
- **Owner:** Engineering + Architecture + Product
- **Status:** Draft
- **Related docs:** `../01-product/product-spec.md`, `../01-product/contribution-engine.md`, `../02-architecture/database-design.md`, `../02-architecture/api-spec.md`, `mvp-implementation-blueprint.md`, `../04-design/wireframe-notes.md`

## 1. Planning Scope

This plan covers implementation sequencing for the MVP core loop:

1. user identity and profile
2. post discovery and response
3. collaboration and verification
4. reviews, credits, and reputation
5. dispute, moderation, and auditability
6. realtime and notifications
7. stabilization and release readiness

This is documentation-only execution planning.

## 2. Execution Assumptions

- Sprint length: 2 weeks.
- Team shape: 1 frontend pod, 1 backend pod, shared platform/data support.
- Delivery model: contract-first API, modular monolith, single production API deployment unit for MVP.
- Definition of release-ready: all critical trust paths covered by automated tests and staging verification.

## 3. Engineering Priorities (Ordered)

1. lifecycle integrity before UX polish
2. trust and audit correctness before optimization
3. API contract stability before realtime rollout
4. moderation safety before public beta exposure
5. observability and rollback safety before production promotion

## 4. Dependency Order Between Systems

1. monorepo baseline and shared contracts
2. auth + users + profiles
3. posts + applications
4. collaborations + verification
5. reviews + credits + reputation
6. reporting + moderation + audit
7. notifications + realtime events
8. hardening, performance, release controls

Dependency rule:

- A trust downstream system cannot start integration until upstream lifecycle state transitions are contract-stable.

## 5. MVP Delivery Milestones

- **Milestone A:** Identity and Profile Ready
- **Milestone B:** Contribution Discovery and Acceptance Ready
- **Milestone C:** Collaboration and Verification Ready
- **Milestone D:** Trust Settlement Ready (reviews, credits, reputation)
- **Milestone E:** Safety and Audit Ready (disputes, moderation, audit)
- **Milestone F:** Beta Readiness (realtime, notifications, stabilization)

## 6. Sprint-by-Sprint Plan

## Sprint 1: Foundation and Identity Baseline

### Objectives

- Establish implementation workspace aligned to monorepo blueprint.
- Finalize API contracts for auth/users/profiles.
- Implement identity and profile baseline paths first in sequencing plan.

### Backend Focus

- Auth module contract readiness.
- User/profile module contract readiness.
- Authorization middleware and policy guards baseline.

### Frontend Focus

- Auth screens and guarded routes planning alignment to `wireframe-notes`.
- Profile onboarding flow contract integration readiness.

### Data and Migration Sequence

- Migration `001_baseline_identity_profile_skills`.
- Seed `skills` reference data for MVP categories.

### Done Criteria

- Auth and profile API contracts pass contract tests.
- Role policy baseline (`public`, `user`) validated.
- Profile create/read/update flow validated in staging integration.
- Migration and rollback notes documented.

## Sprint 2: Posts and Applications

### Objectives

- Enable post creation, feed, details, and response/application flow.
- Establish first lifecycle transitions: `open -> in_review -> accepted`.

### Backend Focus

- `posts` and `applications` modules.
- Acceptance endpoint behavior and state conflict enforcement.

### Frontend Focus

- Discover feed, post details, create post flow, apply/respond flow.
- Owner candidate review and accept action UX state handling.

### Data and Migration Sequence

- Migration `002_posts_and_requirements`.
- Migration `003_post_responses`.
- Add indexes for post feed and response retrieval.

### Done Criteria

- Post creation/read/update and application endpoints pass integration tests.
- Invalid transitions return `409 STATE_CONFLICT` as documented.
- Discover and response UI flows validate against API contracts.
- Milestone B achieved.

## Sprint 3: Collaborations and Verification

### Objectives

- Enable collaboration lifecycle from acceptance to verification.
- Add strict transition guards and verification decision flow.

### Backend Focus

- `collaborations`, `collaboration_events`, `verification_requests`, `verification_decisions`.
- Transition rules:
  - `pending -> active -> awaiting_verification`
  - `awaiting_verification -> verified/disputed`

### Frontend Focus

- Collaboration room, timeline, mark-complete action.
- Verification modal with verify/reject decision states.
- Dispute state visibility when decisions mismatch.

### Data and Migration Sequence

- Migration `004_collaborations_and_events`.
- Migration `005_verification`.
- Add lifecycle state indexes for collaboration queries.

### Done Criteria

- Transition guard tests cover valid/invalid state changes.
- Verification mismatch creates dispute path trigger.
- Participant-only authorization enforced for collaboration actions.
- Milestone C achieved.

## Sprint 4: Trust Settlement (Reviews, Credits, Reputation)

### Objectives

- Implement trust settlement layer after verification outcomes.
- Ensure append-only trust records and idempotent writes.

### Backend Focus

- `reviews`, `credit_ledger_entries`, `credit_holds`, `reputation_events`, `reputation_snapshots`.
- Idempotency key enforcement for trust-affecting mutations.

### Frontend Focus

- Review submission experience.
- Credits/reputation summary and history views.
- Settlement confirmation and trust surfaces in dashboard/profile.

### Data and Migration Sequence

- Migration `006_reviews`.
- Migration `007_credit_ledger_and_holds`.
- Migration `008_reputation_events_and_snapshots`.
- Add unique index for ledger idempotency key.

### Done Criteria

- Verified collaboration produces review, ledger, and reputation side effects.
- Duplicate trust writes handled per idempotency rules.
- Snapshot and history views align with backend source-of-truth events.
- Milestone D achieved.

## Sprint 5: Moderation, Disputes, and Audit Trail

### Objectives

- Implement safety workflow for disputed contributions.
- Ensure moderation and trust reversals are fully auditable.

### Backend Focus

- `reports`, `moderation_cases`, `moderation_actions`, `moderation_evidence`, `audit_log`.
- Moderation-linked trust adjustments with source references.

### Frontend Focus

- Report submission flow.
- Dispute status view.
- Moderation outcome notifications and trust-state messaging.

### Data and Migration Sequence

- Migration `009_reports_and_moderation_cases`.
- Migration `010_moderation_actions_evidence`.
- Migration `011_audit_log`.
- Add indexes for moderation queue and audit lookup.

### Done Criteria

- Dispute creation and moderation case lifecycle tested end-to-end.
- Moderation actions generate audit entries and trust side effects references.
- `under_moderation` lock behavior enforced for protected actions.
- Milestone E achieved.

## Sprint 6: Realtime and Notifications Rollout

### Objectives

- Add realtime synchronization for collaboration and trust-adjacent states.
- Introduce notifications for pending actions and state transitions.

### Backend Focus

- websocket gateway integration.
- domain event publication after committed transactions.
- notifications read/list APIs and event emitters.

### Frontend Focus

- Notification list + read state.
- Realtime collaboration state updates in room/dashboard.
- Verification/dispute status live updates.

### Rollout Timing

- Start with passive events (status sync) under feature flag.
- Enable active collaboration updates after stability checks.

### Data and Migration Sequence

- Migration `012_notifications`.
- Optional event-outbox table if event durability is adopted in MVP.

### Done Criteria

- Realtime channels authenticated and scoped by user/collaboration.
- API remains source of truth for all trust-sensitive decisions.
- Notification and realtime flows validated in staging.
- Milestone F achieved.

## Sprint 7: Stabilization, Testing, and Release Readiness

### Objectives

- Hardening, performance baseline, regression control, and release gates.

### Testing Phase

- Complete unit coverage for trust rule modules.
- Integration coverage for lifecycle and moderation paths.
- Contract test pass for all MVP API groups.
- E2E scenarios:
  - post -> application -> collaboration -> verification -> review -> settlement
  - mismatch -> dispute -> moderation -> audit/trust adjustments

### CI and Release Gates

- strict CI pass on lint, typecheck, unit, integration, contract, migration validation.
- staging smoke checks for critical flows.
- release checklist sign-off from engineering, product, and safety.

### Done Criteria

- Zero open critical defects in trust-critical paths.
- Migration checks pass in staging and pre-prod.
- Runbook for rollback and incident response documented.
- Production readiness sign-off complete.

## 7. Frontend/Backend Coordination Flow

Per sprint coordination model:

1. Sprint planning:
- agree endpoint contracts and payload schemas first.

2. Mid-sprint sync:
- backend shares mock/stub contract snapshots.
- frontend validates UI states against contract examples.

3. Pre-merge sync:
- contract tests and UI integration checks must both pass.

4. End-sprint demo:
- demonstrate lifecycle stage completed in full stack path.

Coordination rule:

- No frontend state assumption may bypass documented backend lifecycle states.

## 8. Database Migration Sequencing Summary

1. identity/profile/skills
2. posts and requirements
3. applications (post responses)
4. collaborations and events
5. verification requests and decisions
6. reviews
7. credits ledger and holds
8. reputation events and snapshots
9. reports and moderation cases
10. moderation actions and evidence
11. audit log
12. notifications and optional event outbox

Migration governance:

- one logical domain change per migration group
- include forward-only change notes
- include index and constraint rationale

## 9. Realtime Rollout Timing

- Not in initial lifecycle foundation sprints.
- Begin only after lifecycle contracts are stable (post Sprint 5).
- Roll out behind flags:
  - phase 1: notification badge and passive status updates
  - phase 2: collaboration-room live updates
  - phase 3: verification/dispute live transitions

## 10. Moderation and Trust-System Rollout Timing

- Trust core (reviews/ledger/reputation) starts in Sprint 4.
- Moderation and audit control starts in Sprint 5.
- Realtime trust visibility starts in Sprint 6.

Rationale:

- settlement and trust math must be stable before moderation reversals.
- moderation must exist before broad beta exposure.

## 11. Stabilization and Testing Phases

Stabilization begins in Sprint 6 and intensifies in Sprint 7:

- defect triage by trust criticality
- performance checks on feed and collaboration queries
- authorization penetration tests for role boundaries
- moderation path resilience tests
- migration and rollback rehearsal in staging

## 12. Risk Areas and Mitigation Notes

### Risk: Lifecycle State Drift Between UI and API

- Mitigation: contract-first development and transition guard tests.

### Risk: Duplicate Credit/Reputation Writes

- Mitigation: idempotency keys, unique constraints, and reconciliation checks.

### Risk: Dispute Volume Overwhelms Moderation

- Mitigation: queue prioritization, moderation states, and staged rollout thresholds.

### Risk: Realtime Causes Inconsistent UI State

- Mitigation: treat websocket as eventual updates only; force API refresh on critical actions.

### Risk: Migration Errors in Late Sprints

- Mitigation: migration validation in CI and pre-deploy dry-run checks.

## 13. OPEN DECISION

- What exact sprint boundary should introduce optional Google OAuth versus email-only auth?
- Should review submission require both verification decisions, or be allowed after unilateral verify with timeout?
- Is credit settlement always hold/release based, or do some collaboration types use platform-issued credits?
- What timeout value transitions verification to `disputed` versus `cancelled`?
- What subset of moderation case details should be visible to involved participants in MVP?
- Is event outbox mandatory in MVP Sprint 6, or can direct publish with retry suffice?
- What target test coverage thresholds are required to mark Sprint 7 done?
