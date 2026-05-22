# Branch Hygiene

## Purpose

Keep local branches, remote branches, pull requests, and merged history understandable.

## Branch Naming Rules

Create short, descriptive branches that match the actual scope.

### Feature branches

```text
feat/<scope>
```

Examples:

- `feat/platform-productization-foundation`
- `feat/workspace-session-hardening`
- `feat/contribution-readability-polish`

### Docs branches

```text
docs/<scope>
```

Examples:

- `docs/repository-governance-refresh`
- `docs/architecture-map-update`

### Chore branches

```text
chore/<scope>
```

Examples:

- `chore/repository-workspace-governance`
- `chore/tooling-alignment`

### Fix branches

```text
fix/<scope>
```

Examples:

- `fix/session-bootstrap-guard`
- `fix/realtime-reconnect-indicator`

## Source Branch Rule

Unless intentionally continuing an existing branch, create new branches from `origin/main`.

Do not branch from:

- old quarantined workspaces,
- detached temporary worktrees,
- another developer's unfinished local branch,
- stale local `main` without checking against `origin/main`.

## PR Flow

1. update `ContriSkill-main` and verify it points at the intended base,
2. create a dedicated worktree for the branch,
3. implement one coherent scope,
4. run required validation,
5. commit with a clear message,
6. open a PR with scope, rationale, validation, and follow-up notes.

PR checklist expectations:

- one branch, one major purpose,
- no unrelated cleanup mixed in,
- clear validation summary,
- explicit note for anything deferred.

## Merge Flow

Preferred default: **squash merge** for small-to-medium scoped branches.

Typical sequence after merge:

1. verify PR merged on GitHub,
2. update `D:\Dev\src\products\ContriSkill-main`,
3. confirm `main` is current,
4. retire the branch worktree,
5. delete the local and remote branch later if appropriate.

## Branch Deletion Flow

Document the process first. Execute only when ready.

### Local deletion checklist

- branch is merged or intentionally abandoned,
- no unique commits remain that you still need,
- no worktree is still attached to the branch,
- no teammate is actively using it.

Review commands:

```powershell
git branch -vv
git branch --merged origin/main
git log --oneline origin/main..feat/platform-productization-foundation
```

### Remote deletion checklist

- PR is merged or explicitly closed with no future use,
- branch is not the base for another open PR,
- branch name is not serving as an active coordination point.

## Stale Branch Review Policy

Run a branch review at least:

- before starting a new major phase,
- after a merge batch,
- before repository cleanup,
- whenever branch names start to feel ambiguous.

Suggested review commands:

```powershell
git branch -vv
git branch --merged origin/main
git branch -r --merged origin/main
git branch -r --no-merged origin/main
```

Classify each branch as:

- active,
- merged and removable later,
- blocked but still needed,
- stale and ready for intentional cleanup.

## Anti-Patterns To Avoid

- temporary names like `temp/...` for normal feature work,
- long-lived branches with unclear ownership,
- local branches that accidentally track `origin/main` instead of the matching feature branch,
- using `main` as a personal work branch,
- keeping old merged branches around without periodic review.
