# Developer Checklist

## Before Starting A Phase

- [ ] Confirm the phase scope is clear and bounded.
- [ ] Decide the branch name before creating the worktree.
- [ ] Create or choose the correct `ContriSkill-<phase>` worktree.
- [ ] Confirm `origin/main` is the intended base.
- [ ] Do not use `D:\Dev\src\products\ContriSkill` for new work.

## Before Running Codex

- [ ] Open the exact folder you want Codex to edit.
- [ ] Run `git rev-parse --show-toplevel`.
- [ ] Run `git branch --show-current`.
- [ ] Run `git status --short --branch`.
- [ ] Run `git worktree list`.
- [ ] Confirm the path is not an accidental detached temporary worktree.

## Before Committing

- [ ] Re-read the task scope.
- [ ] Confirm only intended files changed.
- [ ] Review `git diff --stat`.
- [ ] Run the required validation for the task scope.
- [ ] Make sure no unrelated debug files are included.

## Before Opening A PR

- [ ] Confirm the branch name matches the work.
- [ ] Confirm the PR scope is one coherent change set.
- [ ] Summarize what changed and why.
- [ ] Include validation results.
- [ ] Call out follow-ups or deferred work honestly.

## After Merge

- [ ] Verify the PR is merged on GitHub.
- [ ] Update `D:\Dev\src\products\ContriSkill-main`.
- [ ] Confirm `main` matches the expected remote state.
- [ ] Decide whether the feature worktree still has a purpose.
- [ ] Schedule branch and worktree retirement if the phase is complete.

## Before Deleting A Worktree

- [ ] Confirm the worktree is not your current shell or editor folder.
- [ ] Confirm `git status` is clean inside that worktree.
- [ ] Confirm the branch history is preserved.
- [ ] Confirm no teammate still needs the branch.
- [ ] Confirm the branch has been reviewed for unique commits.
