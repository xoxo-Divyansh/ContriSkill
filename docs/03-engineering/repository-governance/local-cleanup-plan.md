# Local Cleanup Plan

## Purpose

This file documents the safe cleanup strategy for ContriSkill local repositories, worktrees, and branches.

**This is a plan only. Do not execute cleanup from this document automatically.**

## Cleanup Target 1: `D:\Dev\src\products\ContriSkill`

Status: quarantined old workspace.

### Goal

Decide whether anything in this workspace still needs to be preserved, ported, or archived before it stops being part of active development.

### Safe cleanup sequence

1. inventory branch, modified files, and untracked files,
2. compare anything important against `D:\Dev\src\products\ContriSkill-main`,
3. classify each change as:
   - already superseded,
   - still valuable and needs manual porting,
   - archive-only,
   - safe to discard later,
4. only after explicit confirmation, perform any cleanup in a separate intentional step.

### Explicit warning

Do not resume active feature development from this folder.

## Cleanup Target 2: `D:\Dev\src\products\ContriSkill-main`

Status: canonical management workspace.

### Goal

Keep this workspace trustworthy, current, and easy to reason about.

### Safe cleanup sequence

1. return the workspace to a clean `git status` after each phase,
2. keep `main` aligned with `origin/main`,
3. avoid leaving local-only placeholder branches attached longer than necessary,
4. use this workspace primarily for management, branching, audits, and lightweight governance changes.

## Cleanup Target 3: Temporary Feature Worktrees

Examples:

- `D:\Dev\src\products\ContriSkill-platform-productization`
- `D:\Dev\src\products\ContriSkill-workspace-foundation`

### Goal

Retire worktrees cleanly after merge without losing history or uncommitted work.

### Safe cleanup sequence

1. verify the PR is merged,
2. verify the worktree is clean,
3. confirm no active follow-up work remains there,
4. remove the worktree from the canonical workspace,
5. delete the branch later if policy and branch state allow.

## Cleanup Target 4: Stale Local Branches

### Goal

Reduce branch clutter without deleting anything that still contains unique work.

### Safe review sequence

1. list all local branches,
2. review upstream tracking,
3. identify merged branches,
4. check whether any branch still has unique commits,
5. group branches into:
   - keep active,
   - merged and removable later,
   - investigate before removal,
   - archive decision needed.

Useful review commands:

```powershell
git branch -vv
git branch --merged origin/main
git log --oneline origin/main..branch-name
```

## Cleanup Target 5: Stale Remote Branches

### Goal

Keep GitHub branch lists understandable and reduce accidental reuse of outdated remote branches.

### Safe review sequence

1. review merged remote branches,
2. compare against open and closed PRs,
3. identify renamed, superseded, or abandoned branches,
4. remove only after confirming no active dependency remains.

Useful review commands:

```powershell
git branch -r --merged origin/main
git branch -r --no-merged origin/main
```

## Common Cleanup Mistakes To Avoid

- deleting a branch before checking for unique commits,
- removing a worktree that still has uncommitted changes,
- assuming the old `ContriSkill` workspace is safe to clean without comparison,
- doing cleanup from the wrong folder,
- cleaning because the branch name looks old rather than because it is verified stale.

## Recommended Cleanup Order

When cleanup is eventually approved, use this order:

1. reconcile the quarantined old workspace,
2. normalize the canonical workspace state,
3. retire merged feature worktrees,
4. clean stale local branches,
5. clean stale remote branches.
