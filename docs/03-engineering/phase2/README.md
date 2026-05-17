# Phase 2 Platform Evolution Planning Pack

## Purpose

Define the next-stage platform evolution strategy after Sprint 2 foundation work, without changing runtime behavior.

## Scope

- Architecture and planning only.
- No runtime implementation claims.
- No API contract mutations in this pack.

## Current Status

- Backend/auth/capability/contribution foundation exists.
- Contribution service + API integration layer exists.
- Persistence, retrieval, event dispatch, moderation execution, and notification delivery are still evolution-phase systems.

## Recommended Reading Order

1. `contribution-persistence-strategy.md`
2. `event-architecture.md`
3. `query-search-architecture.md`
4. `frontend-integration-strategy.md`
5. `notification-architecture.md`
6. `moderation-execution-architecture.md`
7. `realtime-architecture-direction.md`
8. `feed-ranking-direction.md`
9. `observability-operational-roadmap.md`
10. `scaling-boundaries.md`

## Document Index

- `contribution-persistence-strategy.md`: persistence evolution from in-memory to DB-backed contribution workflows.
- `query-search-architecture.md`: retrieval, filtering, pagination, and search/ranking separation.
- `event-architecture.md`: domain/integration event model and async processing boundaries.
- `realtime-architecture-direction.md`: realtime channel direction and collaboration sync boundaries.
- `moderation-execution-architecture.md`: execution-grade moderation workflow architecture.
- `notification-architecture.md`: notification sources, delivery channels, and reliability boundaries.
- `frontend-integration-strategy.md`: web integration strategy over current API foundations.
- `feed-ranking-direction.md`: discovery/ranking strategy with trust and anti-spam controls.
- `observability-operational-roadmap.md`: logs, metrics, tracing, dashboards, and failure visibility roadmap.
- `scaling-boundaries.md`: modular monolith scaling path and future extraction boundaries.
