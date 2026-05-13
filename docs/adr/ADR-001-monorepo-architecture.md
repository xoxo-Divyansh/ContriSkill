# ADR-001: Monorepo Architecture

- **Status:** Accepted for Phase-0 Governance
- **Date:** 2026-05-13
- **Owner:** Architecture

## Context

ContriSkill is a docs-first repository with no implementation code yet. The platform is expected to evolve into a trust-centered contribution system with a web experience, API, shared contracts, and audit-sensitive domain logic.

The repository currently contains empty `frontend/` and `backend/` folders, but no canonical implementation layout has been established.

## Decision

ContriSkill will use a **monorepo architecture** as the canonical implementation direction.

The intended future structure is:

```text
apps/
  web/
  api/
packages/
  ui/
  contracts/
  domain/
  config/
database/
docs/
tests/
tooling/
```

Documentation will remain under `docs/`, organized by governance domain.

## Why

- keeps frontend, backend, and shared contracts in one versioned workspace
- supports a modular monolith without forcing early service separation
- improves documentation-to-code traceability
- reduces coordination overhead for a small founding team

## Consequences

- future implementation should target `apps/` and `packages/`, not the legacy empty `frontend/` and `backend/` folders
- shared domain contracts should be centralized rather than duplicated across surfaces
- repo tooling should assume a monorepo baseline when implementation begins

## OPEN DECISION

- When implementation starts, should the legacy empty folders be deleted immediately or migrated in a staged change?
- What tooling stack should manage the monorepo once implementation begins?
