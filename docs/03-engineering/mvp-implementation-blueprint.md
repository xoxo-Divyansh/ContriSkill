# MVP Implementation Blueprint

- **Purpose:** Bridge ContriSkill governance and architecture decisions into an implementation-ready MVP engineering plan.
- **Owner:** Architecture + Engineering
- **Status:** Draft
- **Related docs:** `../00-overview/repository-structure.md`, `../02-architecture/architecture.md`, `../02-architecture/api-spec.md`, `../02-architecture/database-design.md`, `../02-architecture/tech-stack.md`, `../01-product/contribution-engine.md`, `../adr/ADR-001-monorepo-architecture.md`, `../adr/ADR-002-auth-and-session-strategy.md`, `../adr/ADR-003-ledger-and-audit-principles.md`

## 1. Blueprint Scope

This blueprint defines how to implement the MVP without changing product intent:

- contribution lifecycle integrity
- ledger and reputation auditability
- moderation traceability
- modular monolith boundaries that can scale later

This is an engineering planning document, not implementation code.

## 2. Monorepo Structure

Target structure for implementation branch:

```text
project-root/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── domain/
│   ├── contracts/
│   └── config/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── e2e/
├── tooling/
└── docs/
```

Guidance:

- `apps/web` owns UI, routing, and client-side orchestration.
- `apps/api` owns domain application services and APIs.
- `packages/domain` contains shared domain vocabulary, constants, and state enums.
- `packages/contracts` contains API request/response schemas and typed clients.
- `packages/ui` contains reusable presentation components only.
- `packages/config` centralizes lint, formatter, TS config, and test config.

## 3. Frontend Architecture Boundaries

Frontend modules in `apps/web`:

- `auth` module: login, registration, session status, route guards.
- `profile` module: public and self profile views.
- `discover` module: post feed, filters, post detail.
- `applications` module: apply, owner review, accept flow.
- `collaboration` module: room view, timeline, completion action.
- `verification` module: verify/reject flow, review submission.
- `trust` module: credits, reputation summary, trust history views.
- `moderation` module: report flow and dispute status visibility.
- `notifications` module: in-app event list and read state.

Boundary rules:

- frontend never computes authoritative trust outcomes.
- frontend only renders server-provided lifecycle and trust states.
- trust-affecting actions must use API idempotency keys where required.

## 4. Backend Architecture Boundaries

Backend modules in `apps/api/src/modules`:

- `auth`
- `users`
- `skills`
- `posts`
- `applications`
- `collaborations`
- `verification`
- `reviews`
- `credits`
- `reputation`
- `reports`
- `moderation`
- `notifications`
- `audit`

Service layer boundaries:

- each module exposes a service interface and route/controller adapter.
- cross-module coordination happens through application services, not direct table writes from controllers.
- trust-changing operations must pass through `credits`, `reputation`, `moderation`, and `audit` services as applicable.

## 5. API Layering and Service Organization

Use four layers in `apps/api`:

1. transport layer
- HTTP routes, auth guards, validation, error mapping.

2. application layer
- lifecycle orchestration and policy enforcement.

3. domain layer
- state machines, transition guards, trust rules, decision utilities.

4. infrastructure layer
- repositories, DB adapters, queues, real-time gateway adapters.

Request flow standard:

1. validate request
2. authorize actor
3. enforce state transition
4. persist mutation
5. write trust side effects
6. write audit events
7. publish notification/realtime event

## 6. Database and Migration Strategy

Migration rules:

- use timestamped, forward-only migrations.
- never edit an applied migration.
- include rollback notes in migration metadata when destructive changes are unavoidable.
- use expand-migrate-contract for breaking schema changes.

Execution strategy:

1. `baseline` migration for identity, posts, collaborations, verification, ledger, moderation, audit.
2. `seed` strategy for skills taxonomy and local dev test accounts.
3. `pre-deploy` migration check in CI for SQL validity and drift detection.
4. `post-deploy` verification for expected indexes and constraints.

Data integrity requirements:

- append-only behavior for `credit_ledger_entries`, `reputation_events`, `audit_log`.
- unique idempotency constraints for trust-affecting writes.
- foreign key constraints for all lifecycle relations.

## 7. Auth and Authorization Structure

Authentication:

- email/password and optional OAuth provider.
- short-lived access token and rotating refresh session model.
- secure session invalidation on logout and risk signals.

Authorization:

- role model: `public`, `user`, `participant`, `owner`, `moderator`, `admin`.
- policy checks at application layer, not only route middleware.
- participant checks for collaboration, verification, and review actions.
- moderation and audit endpoints restricted by moderator/admin role.

Security controls:

- request validation at boundary
- rate limiting by route sensitivity
- account lock/risk throttling hooks for abuse patterns

## 8. Realtime Communication Architecture

MVP realtime scope:

- collaboration room message events
- collaboration state updates
- verification/dispute status updates
- notification badge counters

Architecture:

- websocket gateway attached to API service.
- server publishes domain events after committed transactions.
- clients subscribe by authenticated channels scoped to user and collaboration IDs.

Rules:

- realtime is eventual consistency for UI; API remains source of truth.
- no trust calculation in socket handlers.
- moderation-locked resources emit lock-state updates to participants.

## 9. Testing and CI Workflow

Test layers:

- unit: domain rules, transition guards, credit/reputation calculators.
- integration: module services with database.
- contract: API schema and response contract checks.
- e2e: core user flow from post creation to verification outcome.

MVP critical test paths:

- lifecycle transitions and invalid transition rejection
- verification mismatch to dispute path
- ledger idempotency behavior
- moderation action to audit linkage
- authorization boundaries for participant and moderator routes

CI pipeline stages:

1. lint and format check
2. typecheck
3. unit tests
4. integration tests
5. contract tests
6. migration validation

Branch policy:

- required CI pass before merge to `main`
- required reviewer approval for trust-affecting modules

## 10. Deployment Workflow

Environments:

- `dev` for active branch testing
- `staging` for release candidate verification
- `prod` for live traffic

Deployment sequence:

1. deploy API and run migrations
2. verify health checks and migration state
3. deploy web
4. run smoke checks for auth, feed, collaboration, verification

Release controls:

- feature flags for high-risk trust features
- canary rollout for moderation and settlement rule changes
- rollback playbook for API and migration incidents

## 11. Environment Strategy

Configuration model:

- environment variables per app (`web`, `api`, `database`).
- shared variable naming conventions documented in `packages/config`.
- no secrets in source control.

Required variable categories:

- auth secrets and token settings
- database connection and pool settings
- websocket/public endpoint settings
- notification provider settings
- observability settings

Operational guidance:

- provide `.env.example` templates only
- validate required env vars at app startup
- fail fast when critical secrets are missing

## 12. Coding Standards and Module Ownership

Standards:

- TypeScript strict mode for `apps` and shared packages.
- explicit input validation for all write endpoints.
- no controller-level business logic beyond orchestration.
- no direct DB writes in route handlers.
- trust-affecting changes require audit references.

Module ownership model:

- `auth`, `users`: identity team
- `posts`, `applications`, `collaborations`, `verification`, `reviews`: contribution lifecycle team
- `credits`, `reputation`, `audit`: trust systems team
- `reports`, `moderation`, `notifications`: safety operations team
- shared packages (`domain`, `contracts`, `config`): platform team

Review rules:

- trust systems team approval required for ledger/reputation changes.
- safety operations team approval required for moderation workflow changes.
- platform team approval required for shared package contract changes.

## 13. MVP Implementation Sequence

1. establish monorepo and shared package contracts
2. implement auth and user profile baseline
3. implement posts and applications flow
4. implement collaborations and verification flow
5. implement reviews, credit ledger settlement, reputation events
6. implement reporting, moderation, and audit linkage
7. implement notifications and realtime sync
8. harden with tests, CI gates, and staged deployment checks

## 14. OPEN DECISION

- Should trust-critical modules share one deployment unit in MVP, or be split only at growth stage?
- Which exact events should be emitted to realtime channels versus pulled by API polling?
- What is the production fallback if websocket delivery is degraded?
- What is the minimum moderation staffing model needed before opening beta?
- Which modules are eligible for feature flags at first production launch?
