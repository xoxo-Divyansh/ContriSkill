# Repository Governance

## Purpose

This folder defines the official repository, branch, worktree, and Codex workflow for ContriSkill.

Use these docs to keep local workspaces, Git branches, Codex sessions, and GitHub pull requests aligned.

> If guidance in this folder conflicts with older lightweight workflow notes, this folder wins.

This folder is the **source of truth** for repository/worktree/Git/Codex governance.

## Canonical Workspace Decision

**Official canonical repository:** `D:\Dev\src\products\ContriSkill-main`  
**WSL equivalent:** `/mnt/d/Dev/src/products/ContriSkill-main`

This path is the source of truth for repository management because it is:

- attached to the maintained Git history that matches the active GitHub repository,
- the cleanest management-oriented local copy currently in use,
- the safest place to create branches and new worktrees from,
- the easiest workspace to treat as the long-term reference path in docs, IDEs, and Codex sessions.

## Quarantined Workspace Warning

**Do not use** `D:\Dev\src\products\ContriSkill` for active feature development.

That older workspace is quarantined until it is intentionally reconciled. It has already caused confusion around:

- stale local `main` state,
- dirty files that do not match the canonical repo,
- uncertainty about which workspace Git and Codex are actually using,
- IDE and terminal sessions pointing at different folders.

Treat it as **read-only for investigation** until a separate cleanup step is intentionally executed.

## Canonical Workspace Roles

### `ContriSkill-main`

Use `D:\Dev\src\products\ContriSkill-main` for:

- repository audits,
- pulling and verifying `main`,
- creating new worktrees,
- reviewing branch hygiene,
- small governance or repository-maintenance changes when no dedicated feature worktree is needed.

### `ContriSkill-<phase>`

Use a dedicated sibling worktree for each active major phase, for example:

- `D:\Dev\src\products\ContriSkill-platform-productization`
- `D:\Dev\src\products\ContriSkill-realtime-hardening`
- `D:\Dev\src\products\ContriSkill-docs-governance`

Rule of thumb:

- one major phase,
- one Git branch,
- one worktree,
- one Codex session rooted in that worktree.

## Codex Writable-Root Rules

Codex can only edit safely inside the writable root it was launched against.

That means:

- start Codex from the exact repository path you want to edit,
- verify the repo root inside Codex before implementation,
- do not assume that a nearby folder with a similar name is safe,
- do not continue if Codex is attached to a detached temporary worktree unless that was intentional.

Typical safe launch targets:

- management work: `D:\Dev\src\products\ContriSkill-main`
- feature work: `D:\Dev\src\products\ContriSkill-<phase>`

## Branch and Worktree Policy

- `main` remains the protected long-lived integration branch.
- New work starts from `origin/main` unless a continuation branch is explicitly intended.
- Feature work should happen in a dedicated `ContriSkill-<phase>` worktree.
- Avoid placeholder branch names like `temp/...` for normal development.
- Do not reuse the old `D:\Dev\src\products\ContriSkill` workspace for new tasks.
- After merge, clean up branches and worktrees intentionally using the documented process in this folder.

## Common Mistakes We Already Faced

- opening the old `ContriSkill` folder and assuming it was current,
- launching Codex from a detached worktree under `C:\Users\...\.codex\worktrees\...`,
- using a temporary branch name and later losing track of whether it had an upstream,
- opening VS Code on one folder while the terminal or Codex session pointed at another,
- assuming a similarly named folder was a Git repository when it was only a plain directory.

## Safe Recovery Principle

If the repo path, branch, or worktree looks wrong:

1. stop before editing,
2. verify the actual repo root and branch,
3. relaunch in the correct workspace if needed,
4. only reconcile wrong-workspace changes intentionally.

## Read Next

- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\worktree-management.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\branch-hygiene.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\codex-workflow.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\local-cleanup-plan.md`
- `D:\Dev\src\products\ContriSkill-main\docs\03-engineering\repository-governance\developer-checklist.md`
