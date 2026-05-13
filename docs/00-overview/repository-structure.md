# Repository Structure

- **Purpose:** Define the canonical repository layout for Phase-0 Governance and establish the target monorepo direction before application implementation begins.
- **Owner:** Architecture + Engineering
- **Status:** Draft
- **Related docs:** `roadmap.md`, `../03-engineering/git-workflow.md`, `../adr/ADR-001-monorepo-architecture.md`

## Current Repository State

The repository currently contains empty implementation directories:

- `frontend/`
- `backend/`
- `assets/`
- `scripts/`

These directories are intentionally left unused during Phase-0 Governance. No application code should be added to them until the implementation branch formally begins.

## Canonical Documentation Structure

```text
docs/
├── 00-overview/
├── 01-product/
├── 02-architecture/
├── 03-engineering/
├── 04-design/
├── 05-ai-workflow/
└── adr/
```

## Future Monorepo Direction

The intended implementation layout is:

```text
project-root/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── contracts/
│   ├── domain/
│   └── config/
├── database/
├── docs/
├── tests/
└── tooling/
```

This future structure is governed by `../adr/ADR-001-monorepo-architecture.md`.

## Governance Rules

- documentation comes before implementation
- architecture decisions that affect system boundaries must be recorded in ADRs
- unresolved design choices must be marked as **OPEN DECISION**
- legacy empty folders should not become the default implementation target by accident

## OPEN DECISION

- When implementation begins, should `frontend/` and `backend/` be removed immediately or preserved during transition to `apps/`?
- Should `database/` be introduced before application code, or alongside the first schema proposal?
