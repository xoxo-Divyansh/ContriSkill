# Workspace Cleanup Execution Plan (ContriSkill)

Date: 2026-05-23  
Prepared on branch: `docs/workspace-cleanup-execution-plan`  
Scope: Analysis and documentation only (no cleanup actions executed).

## 1) Current Workspace Map

From `git worktree list` (run against `D:/Dev/src/products/ContriSkill-cleanup`):

| Path | HEAD | Branch State |
|---|---|---|
| `D:/Dev/src/products/ContriSkill` | `0bb4096` | `main` |
| `C:/Users/drtvi/.codex/worktrees/104c/ContriSkill` | `552ab9d` | detached HEAD |
| `C:/Users/drtvi/.codex/worktrees/8921/ContriSkill` | `0bb4096` | detached HEAD |
| `D:/Dev/src/products/ContriSkill-cleanup` | `c8132c1` | `docs/workspace-cleanup-execution-plan` |
| `D:/Dev/src/products/ContriSkill-main` | `c8132c1` | `temp/workspace-cleanup-holder` |

Additional status checks:

- `D:/Dev/src/products/ContriSkill-cleanup`: clean (`## docs/workspace-cleanup-execution-plan`)
- `D:/Dev/src/products/ContriSkill-main`: clean (`## temp/workspace-cleanup-holder`)
- `D:/Dev/src/products/ContriSkill`: dirty and diverged (`## main...origin/main [ahead 1, behind 16]`)

## 2) Dirty/Diverged Workspace Risks

### `D:/Dev/src/products/ContriSkill` (highest risk)

Current state:
- Ahead/behind divergence: `ahead 1, behind 16` from `origin/main`
- Tracked edits present in API/runtime files and tests
- Untracked realtime diagnostics files present

Risks if cleaned incorrectly:
- Losing uncommitted local work (tracked + untracked)
- Orphaning the single local-only commit on `main`
- Complicating merge/rebase due to large behind count
- Accidentally deleting an actively referenced worktree (`main`)

### Detached Codex worktrees

Current state:
- `C:/Users/drtvi/.codex/worktrees/104c/ContriSkill` at `552ab9d` detached
- `C:/Users/drtvi/.codex/worktrees/8921/ContriSkill` at `0bb4096` detached

Risks:
- Detached work can be hard to discover later
- If removed without inspection, local-only edits/commits may be lost

## 3) Safe Cleanup Order (Execution Later)

1. **Freeze and back up risky work first** (`D:/Dev/src/products/ContriSkill`).
2. **Reconcile legacy `main` divergence** (decide whether to keep, port, or archive the ahead commit).
3. **Inspect detached worktrees** and anchor any valuable detached commits to named branches.
4. **Remove stale worktrees only after verification** that no needed work remains.
5. **Delete local stale branches last**, after remote and recovery checks.

## 4) Commands to Run Later Manually (Do Not Run Now)

> Note: Commands below are a proposed runbook only. They were **not** executed in this task.

### Snapshot and safety backup

```powershell
git -C D:/Dev/src/products/ContriSkill status --short --branch
git -C D:/Dev/src/products/ContriSkill diff > D:/Dev/src/products/_cleanup-backups/ContriSkill-working.diff
git -C D:/Dev/src/products/ContriSkill diff --staged > D:/Dev/src/products/_cleanup-backups/ContriSkill-staged.diff
git -C D:/Dev/src/products/ContriSkill ls-files --others --exclude-standard > D:/Dev/src/products/_cleanup-backups/ContriSkill-untracked.txt
```

### Preserve local-only commit on legacy `main`

```powershell
git -C D:/Dev/src/products/ContriSkill log --oneline --decorate --graph -n 30
git -C D:/Dev/src/products/ContriSkill branch backup/legacy-main-0bb4096 0bb4096
```

### Inspect detached worktrees before removal

```powershell
git -C D:/Dev/src/products/ContriSkill-cleanup worktree list --porcelain
git -C C:/Users/drtvi/.codex/worktrees/104c/ContriSkill status --short --branch
git -C C:/Users/drtvi/.codex/worktrees/8921/ContriSkill status --short --branch
```

### Remove stale worktrees (only after checks pass)

```powershell
git -C D:/Dev/src/products/ContriSkill-cleanup worktree remove C:/Users/drtvi/.codex/worktrees/104c/ContriSkill
git -C D:/Dev/src/products/ContriSkill-cleanup worktree remove C:/Users/drtvi/.codex/worktrees/8921/ContriSkill
```

### Delete local branches likely stale (only after review)

```powershell
git -C D:/Dev/src/products/ContriSkill-cleanup branch -d temp/workspace-cleanup-holder
git -C D:/Dev/src/products/ContriSkill-cleanup branch -d temp/productization-holder
```

## 5) What Must Be Verified Before Each Cleanup Step

Before any command that removes data/refs:

- `git status --short --branch` is reviewed for that specific workspace
- Any uncommitted changes are either committed, stashed, or exported to patch files
- Any detached commit to retain is pointed to by a named branch or tag
- Branch is not the current branch of any worktree (`git branch -vv` plus `git worktree list`)
- Remote counterpart and PR relevance are checked (`git branch -r` and hosting UI)

## 6) Rollback / Recovery Notes

If something is removed unintentionally:

- Use `git reflog` in the affected repo/worktree to find prior HEADs
- Recreate branch from reflog SHA (`git branch recovery/<name> <sha>`)
- Re-apply saved patch files (`git apply <patch-file>`)
- If worktree metadata is inconsistent, re-register from canonical repo using `git worktree add`

Recommended pre-cleanup safety net:

- Keep `_cleanup-backups` diff exports until after cleanup validation
- Avoid deleting backup branches/tags until at least one successful pull/rebase cycle is complete

## 7) Branches Likely Safe to Delete Later

Local-only candidates from `git branch -vv` with temporary naming:

- `temp/workspace-cleanup-holder` (currently checked out at `D:/Dev/src/products/ContriSkill-main`)
- `temp/productization-holder` (local temp branch)

Condition to delete:
- Must not be the active branch in any worktree
- Must be confirmed as merged or intentionally abandoned

## 8) Branches Requiring Manual Review

High-priority manual review:

- `main` in `D:/Dev/src/products/ContriSkill` (`ahead 1, behind 16`)
- `feat/platform-workspace-experience` (`behind 5` vs `origin/main`)
- `feat/realtime-presence-mvp` (`behind 14` vs `origin/main`)
- `chore/repository-workspace-governance` (`ahead 2` vs remote)
- Current docs branch `docs/workspace-cleanup-execution-plan` (retain until this plan is merged)

Reason: each branch has divergence or potential in-flight value that cannot be auto-resolved safely.

## 9) Warnings About Old `D:/Dev/src/products/ContriSkill`

- It is currently the canonical `main` worktree path in `git worktree list`.
- It contains uncommitted tracked and untracked work.
- It has local/remote divergence and should not be removed or reset until reconciliation decisions are documented.
- Treat as **protected** until a maintainer confirms preservation strategy for the ahead commit and working changes.

## 10) Recommended Future Folder Layout

Adopt a two-tier structure:

- `D:/Dev/src/products/` for canonical repositories only
  - Example: `D:/Dev/src/products/ContriSkill`
- `D:/Dev/src/worktrees/` for temporary/ephemeral worktrees only
  - Example: `D:/Dev/src/worktrees/ContriSkill/<ticket-or-branch>`

Operational conventions:

- One canonical bare/non-bare repo location per product under `products/`
- All task/feature/doc branches via `git worktree add` into `worktrees/`
- Name worktree folders by purpose (`feature-*`, `docs-*`, `hotfix-*`, `temp-*`)
- Run a periodic (manual) monthly workspace audit using this execution plan as checklist

---

## Appendix: Captured Remote Branch Snapshot

Observed remote refs include:
- `origin/main`
- `origin/chore/*`
- `origin/docs/*`
- `origin/feat/*`
- `origin/fix/*`
- `origin/infra/*`
- `origin/refactor/*`

This plan intentionally avoids auto-delete recommendations for remote branches; remote cleanup should be coordinated with PR/merge history review.
