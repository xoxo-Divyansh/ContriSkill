# Commit Conventions

- **Purpose:** Standardize commit messages so repository history stays readable during governance and implementation phases.
- **Owner:** Engineering
- **Status:** Draft
- **Related docs:** `git-workflow.md`, `pr-review-checklist.md`

## Format

Use a conventional format:

```text
type(scope): summary
```

## Recommended Types

- `docs` — documentation changes
- `adr` — architecture decision record updates
- `chore` — repo maintenance
- `build` — build or tooling changes
- `ci` — automation changes
- `feat` — new user-facing capability
- `fix` — bug fixes
- `refactor` — internal restructuring without behavior change
- `test` — test coverage changes

## Examples

```text
docs(governance): reorganize canonical docs tree
adr(auth): propose session rotation strategy
chore(repo): replace .github file with directory
```

## Rules

- keep the summary imperative and concise
- mention the affected domain or document when useful
- avoid vague messages such as `update files` or `misc changes`
- if a commit introduces an unresolved design question, reference the **OPEN DECISION** in the body
