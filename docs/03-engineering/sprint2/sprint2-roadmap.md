# Sprint 2 Roadmap

## Sprint 2 Goals

- Move from scaffolding to first real trust-safe vertical slices.
- Introduce real auth/session lifecycle (without expanding to non-MVP auth modes).
- Formalize contribution state transitions and moderation/audit boundaries.
- Validate DB relationship constraints before schema implementation.
- Prepare implementation-ready contracts with explicit validation gates.

## Dependency Inputs from Sprint 1

- Shared constants/contracts baseline.
- Typed environment validation (API/Web).
- API auth module scaffolding and guard middleware shells.
- Web API client shell and provider hierarchy.
- Route group/wrapper foundations.
- UI tokens/primitives foundation.

## Implementation Sequence

1. Auth/session architecture finalization.
2. Roles/permissions and guard mapping finalization.
3. Contribution lifecycle and moderation policy lock.
4. DB relationship + constraints validation.
5. Event/outbox flow decisions.
6. API contract update pass (future Sprint 2 coding branch).

## Milestones

- M1: Auth + roles policy sign-off.
- M2: Lifecycle + moderation sign-off.
- M3: DB constraints + transaction boundaries sign-off.
- M4: Event flow + notification/outbox sign-off.
- M5: Sprint 2 coding kickoff readiness.

## Acceptance Criteria

- Every lifecycle transition has an owner, guard, and failure path.
- Session model defines creation, renewal, revocation, and invalidation.
- Permission matrix maps actors to API guard behavior.
- DB plan documents uniqueness, referential integrity, and audit links.
- Event flow includes idempotency and retry strategy at architecture level.
- Open policy questions are explicitly listed as `OPEN DECISION`.

## Validation Gates

- Gate A (Architecture): no contradictory rules across product/architecture docs.
- Gate B (Security): auth and moderation boundaries reviewed for abuse risks.
- Gate C (Data): constraints/index assumptions validated against MVP query patterns.
- Gate D (Execution): work can be decomposed into coding tasks without policy ambiguity.

## Planned vs Implemented

- Implemented: Sprint 1 infrastructure foundations only.
- Planned: all Sprint 2 business/auth/lifecycle/moderation logic.
