# PR Review Checklist

- **Purpose:** Provide a consistent review checklist for governance, documentation, and future implementation pull requests.
- **Owner:** Engineering + Architecture
- **Status:** Draft
- **Related docs:** `git-workflow.md`, `commit-conventions.md`, `../05-ai-workflow/ai-review-checklist.md`

## Scope

- Is the PR scoped to one coherent change set?
- Does the title and description explain the intent clearly?
- Are unrelated edits avoided?

## Documentation Integrity

- Are affected docs updated in the same PR?
- Are new documents placed in the correct canonical folder?
- Are unresolved areas marked as **OPEN DECISION** instead of being implied as settled?

## Architecture Integrity

- Does the PR align with existing ADRs?
- If it changes architecture direction, does it add or update an ADR?
- Does it avoid implementation details during Phase-0 Governance?

## Trust and Governance

- Does the change preserve auditability and explainability?
- Are moderation, credits, reputation, or verification implications called out?
- Are governance side effects documented?

## Review Outcome

- approve only when the change is internally consistent
- request changes when ambiguity is hidden rather than documented
- prefer narrowing scope over merging speculative decisions
