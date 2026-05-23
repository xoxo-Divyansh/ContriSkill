# CI/CD and Branch Protection

## Objectives
- prevent unsafe merges
- enforce repeatable PR validation
- gate production deployments with clear criteria

## Required Checks (MVP)
Minimum required status checks on protected branches:
- lint
- typecheck
- unit/integration test suite
- build verification (web + API as applicable)
- security baseline scan (dependency/audit/static checks already in toolchain)

Deferred:
- performance regression checks
- contract testing matrix across service versions

## PR Validation Workflow
MVP:
- every PR requires at least one reviewer approval
- unresolved review threads block merge
- required checks must pass on latest commit
- PR includes risk summary and testing notes
- schema-affecting PRs include migration impact note

Deferred:
- CODEOWNERS enforcement per domain
- automated PR classification and risk scoring

## Branch Protection Rules
MVP:
- protect `main` (and release branch if used)
- disallow force push and branch deletion on protected branches
- require linear or squash merge policy (pick one and enforce)
- require up-to-date branch before merge

Deferred:
- stricter commit signing enforcement
- policy exceptions with timed expiry

## Deployment Gates
MVP:
- deploy from protected branch only
- production deployment requires passing required checks and explicit approval
- failed post-deploy smoke checks trigger rollback decision workflow

Deferred:
- fully automated rollback triggers from error-budget policies
- environment promotion pipelines with policy attestations

## Release Checklist (MVP)
- release scope reviewed and frozen
- migration plan reviewed (if applicable)
- changelog/release notes prepared
- rollback plan documented
- monitoring window assigned
- post-release verification completed

Deferred:
- auto-generated release notes from structured metadata
- checklist-to-gate automation

## MVP vs Deferred Summary
MVP:
- strict required checks and review workflow
- protected branch controls
- manual approval production gates

Deferred:
- intelligent risk scoring and automated policy orchestration

## OPEN_DECISION
- Merge strategy standard: `squash` vs `rebase`.
- Whether hotfix path bypass is allowed and under what approvals.
- Minimum reviewer count for high-risk changes (security, persistence, auth).
