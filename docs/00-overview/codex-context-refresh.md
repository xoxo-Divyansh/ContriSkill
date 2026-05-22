# Codex Context Refresh

## Purpose

Persistent onboarding and context-refresh document for future Codex sessions working in ContriSkill.

## 1) Canonical Repository Decision

- Official repository path: `D:\Dev\src\products\ContriSkill-main`
- WSL equivalent: `/mnt/d/Dev/src/products/ContriSkill-main`
- Use this path as the default reference for audits, branching, and documentation.
- Do **not** use `D:\Dev\src\products\ContriSkill` for active implementation work.

## 2) Workspace Governance Snapshot

- `ContriSkill-main` is the canonical management workspace.
- `ContriSkill-<phase>` is the standard naming pattern for active feature worktrees.
- One major phase should map to one branch and one worktree.
- Codex should be launched from the exact repo path it is expected to edit.
- Source of truth: `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\README.md`

## 3) Product and Architecture Snapshot

- Platform: ContriSkill collaborative contribution platform.
- Current state: monorepo foundations, auth/session flow, contribution workflows, realtime/presence foundations, and productized workspace UX are implemented.
- Principle: preserve modular boundaries while hardening workflow clarity and operational safety.

## 4) Monorepo Structure Summary

- `apps/api`: API modules, auth/session, contribution services, realtime runtime, persistence boundaries.
- `apps/web`: Next.js platform UX, session bootstrap, realtime client, contribution workspace surfaces.
- `packages/contracts`: cross-boundary API and realtime contracts.
- `packages/config`: shared configuration keys and constants.
- `packages/domain`: domain types, policies, and shared business structures.
- `packages/ui`: visual primitives, tokens, theme surfaces.
- `packages/utils`: shared utility helpers.
- `database`: migrations and data-layer support files.
- `docs`: product, architecture, engineering, design, and governance docs.

## 5) Required Pre-Flight Commands For Codex

Run these before implementation:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git worktree list
```

If the path, branch, or worktree looks wrong, stop and relaunch in the correct workspace.

## 6) Validation Baseline

Typical commands:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run ci`

Run the smallest scope that proves the change safely when the task allows it.

## 7) Safe Startup Checklist For New Codex Sessions

- Confirm the repo root is `D:\Dev\src\products\ContriSkill-main` or the intended `ContriSkill-<phase>` worktree.
- Confirm the branch matches the requested scope.
- Read `README.md` and the relevant docs for the target area.
- Read `docs/03-engineering/repository-governance/README.md` for workspace rules.
- Check for dirty files before starting.
- Use a plan for multi-step tasks.

## 8) Common Mistakes To Avoid

- editing inside the old `D:\Dev\src\products\ContriSkill` workspace,
- assuming a similarly named folder is a Git repo,
- running Codex from a detached temporary worktree,
- trusting the editor title bar without verifying the actual Git root.

## 9) Reusable Refresh Prompt

> Refresh ContriSkill repository context from `D:\Dev\src\products\ContriSkill-main` in read-only mode.  
> Review `README.md`, `docs/00-overview/*`, `docs/02-architecture/*`, `docs/03-engineering/*`, `apps/api/*`, `apps/web/*`, `packages/*`, and root configs.  
> Report implemented vs planned status, active governance rules, current branch/worktree safety, and the safest next step.

## 10) Key References

- `D:\Dev\src\products\ContriSkill-main\README.md`
- `D:\Dev\src\products\ContriSkill-main\docs\00-overview\repository-structure.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\README.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\worktree-management.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\branch-hygiene.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\codex-workflow.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\local-cleanup-plan.md`
