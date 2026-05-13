# AI Review Checklist

- **Purpose:** Provide a review checklist for AI-assisted changes in the repository.
- **Owner:** Engineering
- **Status:** Draft
- **Related docs:** `codex-operating-rules.md`, `../03-engineering/pr-review-checklist.md`

## Repository Alignment

- Did the AI place files in the correct canonical location?
- Did it avoid unrelated repo churn?
- Did it preserve the current phase boundaries?

## Decision Integrity

- Are unresolved decisions explicitly labeled as **OPEN DECISION**?
- Did the AI avoid claiming finality where the team has not yet decided?
- Are ADRs used for meaningful architectural direction changes?

## Implementation Safety

- Did the AI avoid adding application features during a governance-only task?
- Did it avoid package installation and script execution outside the requested scope?
- Did it avoid inventing fake database schemas or API behavior beyond current product decisions?

## Review Quality

- Are changes readable and professionally structured?
- Are related docs linked where helpful?
- Is the resulting governance structure easier for future contributors to follow?
