# Codex Workflow

## Purpose

Make sure Codex is always attached to the correct writable root before implementation begins.

## Official Rule

Run Codex from the repository you intend to edit.

### Canonical management workspace

- Windows: `D:\Dev\src\products\ContriSkill-main`
- WSL: `/mnt/d/Dev/src/products/ContriSkill-main`

### Active feature workspace

- Windows: `D:\Dev\src\products\ContriSkill-<phase>`
- WSL: `/mnt/d/Dev/src/products/ContriSkill-<phase>`

## Required Pre-Flight Commands

Run these before asking Codex to implement anything:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git remote -v
git worktree list
```

Optional but useful:

```powershell
Get-Location
```

## What Good Output Looks Like

- repo root matches the folder you intentionally opened,
- branch name matches the requested phase,
- `git status` is understandable before edits start,
- the current worktree has a clear role.

## How To Open The Correct Writable Root

### PowerShell

```powershell
cd D:\Dev\src\products\ContriSkill-platform-productization
codex
```

### WSL

```bash
cd /mnt/d/Dev/src/products/ContriSkill-platform-productization
codex
```

If the task is repository governance, branch management, or merge verification:

```powershell
cd D:\Dev\src\products\ContriSkill-main
codex
```

## If Codex Targets The Wrong Workspace

Stop before editing.

Then verify:

```powershell
git rev-parse --show-toplevel
git branch --show-current
```

If the path or branch is wrong:

1. do not keep implementing,
2. capture notes only if needed,
3. close that session,
4. relaunch Codex from the correct worktree,
5. re-run the pre-flight commands.

## Detached or Temporary Worktree Warning

Pause immediately if you see either of these:

- a path under `C:\Users\<you>\.codex\worktrees\...` when that was not intentional,
- a detached `HEAD` or a placeholder branch like `temp/...` when you expected a normal feature branch.

Detached and temporary worktrees are easy places to lose branch intent.

## Common Mistakes We Already Hit

- using `D:\Dev\src\products\ContriSkill` even though it is no longer the active development workspace,
- assuming `D:\Dev\src\products\ContriSkill-productization` was a Git repo when it was only a similarly named folder,
- trusting the editor title bar instead of checking the actual Git root,
- letting Codex open inside a temporary detached worktree and then editing from there.

## Safe Recovery Paths

### No edits made yet

- relaunch in the correct workspace.

### Edits made in the wrong workspace

- stop and inspect with `git status --short` and `git diff --stat`,
- decide whether to manually reapply or export a patch later,
- do not reset, delete, or clean in a hurry,
- only reconcile after confirming the intended target repo.

## Practical Rule Of Thumb

If you cannot confidently answer all three questions below in under 10 seconds, do not start coding yet:

- Which folder am I in?
- Which branch is attached to it?
- Is this the workspace I actually meant to edit?
