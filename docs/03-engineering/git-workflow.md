# Git Workflow

- **Purpose:** Define how repository changes move from proposal to review to merge during Phase-0 and early implementation.
- **Owner:** Engineering
- **Status:** Draft
- **Related docs:** `commit-conventions.md`, `pr-review-checklist.md`, `../00-overview/repository-structure.md`

## Branching Strategy

Use a lightweight trunk-based workflow:

- `main` is the protected default branch
- create short-lived topic branches from `main`
- keep branch scope narrow to one coherent change set
- prefer documentation, governance, or architecture-only branches during Phase-0

## Recommended Branch Naming

```text
phase0/docs-...
phase0/adr-...
phase0/governance-...
feature/...
fix/...
chore/...
```

## Pull Request Expectations

- open PRs early for visibility
- keep changes reviewable
- link the affected docs or ADRs
- call out all **OPEN DECISION** items explicitly

## Merge Guidance

- prefer squash merges for small governance changes
- do not merge unresolved architectural contradictions
- update docs in the same PR when decisions change

## Phase-0 Constraints

- no frontend or backend implementation
- no dependency installation
- no speculative scaffolding
- no hidden architecture decisions outside docs
