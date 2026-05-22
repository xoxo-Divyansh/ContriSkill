# Git Workflow

- **Purpose:** Preserve a lightweight compatibility entry point while making repository governance documentation the single source of truth.
- **Owner:** Engineering
- **Status:** Active
- **Source of truth:** `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\README.md`
- **Related docs:** `commit-conventions.md`, `pr-review-checklist.md`, `../00-overview/repository-structure.md`

## Governance Source Of Truth

All active guidance for:

- canonical repository selection,
- worktree creation and retirement,
- branch naming and hygiene,
- Codex writable-root verification,
- post-merge cleanup flow,
- safe recovery when the wrong workspace is opened,

now lives in:

- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\README.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\worktree-management.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\branch-hygiene.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\codex-workflow.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\local-cleanup-plan.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\developer-checklist.md`

## Current Working Rules

- `D:\Dev\src\products\ContriSkill-main` is the canonical management workspace.
- `D:\Dev\src\products\ContriSkill` is quarantined and should not be used for active implementation.
- Use `D:\Dev\src\products\ContriSkill-<phase>` for one active branch/worktree per major phase.
- Launch Codex from the exact worktree it should edit and verify with Git pre-flight commands first.
- Review branch and worktree cleanup after merge, but execute cleanup intentionally rather than implicitly.

## Why This Document Still Exists

Older docs and habits may still point to `git-workflow.md`. This file now exists to redirect readers into the consolidated governance system instead of maintaining a second, potentially conflicting rule set.
