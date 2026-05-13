# ContriSkill

ContriSkill is a trust-centered contribution platform where people build identity through contribution, collaboration, verification, credits, reputation, and trust history.

## Current Phase

**Phase-0 Governance Architecture**

This repository is in a documentation-and-governance preparation phase. The current objective is to establish a clean documentation system, repo operating rules, decision records, and contribution governance before any application implementation begins.

## Project Overview

ContriSkill is designed to support:

- contribution-based collaboration
- mentorship and peer learning
- trust-building through verified work
- non-speculative credits as ecosystem utility
- reputation and auditability as platform foundations

The platform is intentionally being planned as a strong, scalable foundation first. This phase does **not** include frontend or backend feature implementation.

## Development Status

- `frontend/`, `backend/`, `assets/`, and `scripts/` are currently empty
- no application features should be implemented during Phase-0 Governance
- documentation is now the system of record for product, architecture, engineering, and AI operating rules
- unresolved platform rules must be marked as **OPEN DECISION**

## Repository Structure

```text
ContriSkill/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── assets/
├── backend/
├── docs/
│   ├── 00-overview/
│   ├── 01-product/
│   ├── 02-architecture/
│   ├── 03-engineering/
│   ├── 04-design/
│   ├── 05-ai-workflow/
│   └── adr/
├── frontend/
├── scripts/
├── .gitignore
└── README.md
```

## Documentation Map

### `docs/00-overview/`

- `roadmap.md` — phased platform roadmap
- `repository-structure.md` — canonical repo layout and future monorepo direction

### `docs/01-product/`

- `vision.md` — mission and ecosystem philosophy
- `product-spec.md` — MVP intent and product boundaries
- `user-flow.md` — contributor and learner lifecycle
- `contribution-engine.md` — credits, verification, contribution lifecycle
- `moderation-system.md` — moderation scope, abuse types, and governance gaps

### `docs/02-architecture/`

- `architecture.md` — platform architecture direction
- `api-spec.md` — draft API surface only
- `tech-stack.md` — recommended stack and rationale
- `database-design.md` — placeholder for canonical data model decisions
- `notification-system.md` — notification scope and future delivery model
- `scaling-strategy.md` — staged scaling principles

### `docs/03-engineering/`

- `git-workflow.md` — branch and merge workflow
- `commit-conventions.md` — commit message standard
- `pr-review-checklist.md` — pull request review expectations

### `docs/04-design/`

- `wireframe-notes.md` — UX and interface notes
- `design-system.md` — design language baseline

### `docs/05-ai-workflow/`

- `codex-operating-rules.md` — operating rules for Codex and AI agents
- `ai-review-checklist.md` — AI-assisted review checklist

### `docs/adr/`

- `ADR-001-monorepo-architecture.md`
- `ADR-002-auth-and-session-strategy.md`
- `ADR-003-ledger-and-audit-principles.md`

## How Contributors Should Work

- treat docs as the source of truth during Phase-0
- do not add app code unless the active branch explicitly changes phase and scope
- use ADRs for architecture decisions that affect structure, security, data, or operational boundaries
- mark unresolved rules, formulas, and policies as **OPEN DECISION**
- keep changes narrow, reviewable, and traceable to product or architecture intent

## How AI Agents Should Work

- read the relevant docs before editing
- do not invent completed product rules that have not been decided
- do not scaffold frontend, backend, or infrastructure in this phase
- do not install packages or run application scripts in this phase
- prefer clarifying structure, governance, and documentation over speculative implementation
- record architectural choices in `docs/adr/` when decisions become stable

## Immediate Next Focus

Phase-0 should continue with:

- canonical database design
- trust, credits, and verification rule definition
- moderation operations and dispute handling design
- implementation blueprint planning for the first engineering branch
