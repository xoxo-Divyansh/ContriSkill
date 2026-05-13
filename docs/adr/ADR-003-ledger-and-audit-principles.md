# ADR-003: Ledger and Audit Principles

- **Status:** Proposed
- **Date:** 2026-05-13
- **Owner:** Architecture + Data

## Context

ContriSkill uses credits, reputation, verification, and moderation as trust-bearing systems. If these systems are modeled as mutable counters without history, disputes and abuse analysis will become opaque and difficult to govern.

## Proposed Decision

Adopt the following principles:

- credits must be represented through an append-only ledger
- reputation-affecting events should be traceable through auditable history
- trust-affecting moderation actions must be recorded
- public trust summaries may be materialized, but source events should remain reviewable

## Why

- preserves explainability for users and moderators
- supports dispute handling and reversals
- reduces hidden state mutations
- gives the platform a stronger governance foundation before scale

## Consequences

- simple mutable score-only models should be avoided
- the database design must separate source-of-truth events from derived summaries
- implementation will need careful transaction boundaries for trust updates

## OPEN DECISION

- Which reputation changes belong in the same ledger model versus a separate audit history?
- What retention policy applies to trust-affecting event history?
- How should reversals, penalties, and dispute outcomes be represented?
