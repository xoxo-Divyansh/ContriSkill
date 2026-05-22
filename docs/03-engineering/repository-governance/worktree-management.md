# Worktree Management

## Purpose

Define the safe, repeatable way to create, verify, use, and retire Git worktrees in ContriSkill.

## Core Rule

**One major phase = one branch = one worktree.**

Do not stack unrelated work on the same branch or in the same working folder.

## Naming Convention

### Canonical management workspace

- Windows: `D:\Dev\src\products\ContriSkill-main`
- WSL: `/mnt/d/Dev/src/products/ContriSkill-main`

This is the control point for repository management.

### Active feature worktrees

Use sibling paths following this pattern:

- Windows: `D:\Dev\src\products\ContriSkill-<phase>`
- WSL: `/mnt/d/Dev/src/products/ContriSkill-<phase>`

Examples:

- `D:\Dev\src\products\ContriSkill-platform-productization`
- `D:\Dev\src\products\ContriSkill-workspace-foundation`
- `D:\Dev\src\products\ContriSkill-docs-governance`

Choose a short phase name that matches the branch intent.

## Standard Creation Flow

Run these from `D:\Dev\src\products\ContriSkill-main`.

### Windows PowerShell example

```powershell
cd D:\Dev\src\products\ContriSkill-main
git status --short --branch
git fetch origin
git worktree add D:\Dev\src\products\ContriSkill-platform-productization -b feat/platform-productization-foundation origin/main
```

### WSL example

```bash
cd /mnt/d/Dev/src/products/ContriSkill-main
git status --short --branch
git fetch origin
git worktree add /mnt/d/Dev/src/products/ContriSkill-platform-productization -b feat/platform-productization-foundation origin/main
```

## Creating a Worktree for an Existing Branch

If the branch already exists locally:

```powershell
cd D:\Dev\src\products\ContriSkill-main
git worktree add D:\Dev\src\products\ContriSkill-platform-productization feat/platform-productization-foundation
```

If the branch exists only on the remote, create the local branch explicitly from the remote tip:

```powershell
cd D:\Dev\src\products\ContriSkill-main
git fetch origin
git worktree add D:\Dev\src\products\ContriSkill-platform-productization -b feat/platform-productization-foundation origin/feat/platform-productization-foundation
```

## Verification Commands

Before editing in any worktree, verify all of the following:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git worktree list
```

Expected outcomes:

- the top-level path matches the folder you intentionally opened,
- the branch name matches the phase you intended,
- the status output is understandable before you begin,
- the worktree list shows a clean map of attached branches.

## Codex Use Rule

Launch Codex from the worktree you actually want to edit.

Examples:

```powershell
cd D:\Dev\src\products\ContriSkill-platform-productization
codex
```

```bash
cd /mnt/d/Dev/src/products/ContriSkill-platform-productization
codex
```

Do not launch Codex from one repo and then ask it to edit another similarly named repo path.

## After Merge: Worktree Retirement Process

Documented process only. Execute it later, intentionally.

1. confirm the branch is merged,
2. confirm the worktree is clean,
3. switch out of that folder,
4. remove the worktree from the canonical workspace.

Example commands:

```powershell
cd D:\Dev\src\products\ContriSkill-main
git branch --merged origin/main
git worktree remove D:\Dev\src\products\ContriSkill-platform-productization
```

Only remove a worktree when:

- no uncommitted changes remain inside it,
- the branch history is preserved elsewhere,
- the branch is no longer needed for active review or follow-up.

## What Not To Do

- do not do active work in `D:\Dev\src\products\ContriSkill`,
- do not use one worktree for multiple unrelated branches,
- do not create feature work directly inside a detached `.codex\worktrees\...` path,
- do not leave branch purpose disconnected from folder name,
- do not remove a worktree before checking for uncommitted changes,
- do not assume VS Code, terminal, and Codex all point to the same folder without verifying.

## Common Recovery Cases

### Wrong folder, no edits yet

- close the session,
- reopen the correct worktree,
- rerun the verification commands.

### Wrong folder, edits already exist

- stop and inspect the changes,
- record the wrong path and branch,
- decide whether to manually reapply, patch-export, or intentionally move the work later,
- do not panic-delete the folder or branch.
