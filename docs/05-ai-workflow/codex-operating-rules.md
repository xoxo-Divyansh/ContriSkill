# Codex Operating Rules

- **Purpose:** Define how Codex and other AI agents should operate in the ContriSkill repository.
- **Owner:** Engineering + Architecture
- **Status:** Draft
- **Related docs:** `ai-review-checklist.md`, `../03-engineering/pr-review-checklist.md`, `../adr/ADR-001-monorepo-architecture.md`

## Core Rules

- read relevant repository docs before making changes
- treat documentation as the source of truth during Phase-0 Governance
- do not implement application features unless the task explicitly changes phase and scope
- do not install packages or run application scripts unless explicitly authorized in a later phase
- do not fabricate completed requirements where the product decision is unresolved
- mark all unresolved architecture or policy areas as **OPEN DECISION**

## Allowed Work in Phase-0

- reorganizing documentation
- creating governance templates
- adding ADRs
- clarifying architecture direction
- identifying system gaps and decision dependencies

## Not Allowed in Phase-0

- generating frontend application code
- generating backend application code
- scaffolding frameworks
- inventing fake production-ready schemas
- adding operational infrastructure for unapproved implementation work

## Documentation Discipline

- place files in the canonical docs structure
- keep titles and ownership clear
- use professional markdown
- split mixed-content documents into canonical sources
- preserve traceability between product, architecture, engineering, and ADRs

## Escalation Rule

If an AI agent encounters ambiguity that would change trust, credits, moderation, data, or security behavior, it should pause the design assumption and record an **OPEN DECISION** instead of silently choosing a direction.
