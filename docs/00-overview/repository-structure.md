# Repository Structure

## Purpose

Define the current ContriSkill monorepo structure and the official repository path conventions used for day-to-day development.

## Canonical Repository Path

- Windows: `D:\Dev\src\products\ContriSkill-main`
- WSL: `/mnt/d/Dev/src/products/ContriSkill-main`

This is the canonical repository path for repository management and shared documentation references.

Repository/worktree/Git/Codex governance source of truth:

- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\README.md`

## Workspace Warning

Do **not** use `D:\Dev\src\products\ContriSkill` for active work.

That older workspace is quarantined until it is intentionally reconciled.

## Current Top-Level Structure

```text
project-root/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── config/
│   ├── contracts/
│   ├── domain/
│   ├── ui/
│   └── utils/
├── database/
├── docs/
├── scripts/
├── tests/
├── tooling/
├── .github/
└── root config files
```

## Responsibility Map

### `apps/api`

Backend API application, auth/session handling, contribution services, realtime runtime, and repository boundaries.

### `apps/web`

Frontend application shell, onboarding, contribution workflows, session/bootstrap UX, and collaborative platform surfaces.

### `packages/config`

Shared configuration constants and environment-key definitions.

### `packages/contracts`

Shared contracts for API payloads, realtime events, drafts, mutations, projections, and session-facing boundaries.

### `packages/domain`

Shared domain models, types, policies, and core business structures.

### `packages/ui`

Shared visual primitives, tokens, theme support, and reusable UI building blocks.

### `packages/utils`

Shared utility helpers that are intentionally small and cross-cutting.

### `database`

SQL migrations and database support files.

### `docs`

Product, architecture, engineering, design, and governance documentation.

### `scripts`

Repository automation and helper scripts.

### `tests`

Cross-workspace or integration-oriented test support where applicable.

### `tooling`

Supporting tooling configuration and development infrastructure where applicable.

## Development Workspace Convention

- `ContriSkill-main`: canonical management workspace.
- `ContriSkill-<phase>`: active feature worktree for one major branch.
- one major phase should not be spread across multiple ambiguous local folders.

## Related Governance Docs

- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\README.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\worktree-management.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\branch-hygiene.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\codex-workflow.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\local-cleanup-plan.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\developer-checklist.md`
