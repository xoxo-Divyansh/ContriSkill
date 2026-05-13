# ContriSkill

ContriSkill is a trust-centered contribution platform where users build identity through contribution, collaboration, verification, credits, reputation, and trust history.

## Current Phase

**Phase 1 MVP Engineering Foundation**

The repository now includes a production-oriented monorepo bootstrap aligned with the architecture and governance docs. Product features are intentionally not implemented yet.

## Repository Layout

```text
ContriSkill/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── config/
│   ├── contracts/
│   ├── domain/
│   ├── ui/
│   └── utils/
├── tooling/
│   └── docker/
├── docs/
│   ├── 00-overview/
│   ├── 01-product/
│   ├── 02-architecture/
│   ├── 03-engineering/
│   ├── 04-design/
│   ├── 05-ai-workflow/
│   └── adr/
├── tests/
├── .github/
└── scripts/
```

## Foundation Scope Completed

- monorepo workspaces and package boundaries
- frontend and backend app skeletons
- TypeScript base configuration and package tsconfigs
- linting and formatting baseline
- shared environment variable strategy
- testing foundation (unit/integration contract-ready structure)
- CI workflow baseline
- git hooks and commit lint foundations
- Docker and docker-compose foundations

## What Is Intentionally Not Implemented

- auth business logic
- contribution or trust business logic
- database schema and migrations beyond planning conventions
- product UI screens and flows

## Local Bootstrap (after dependency install)

```bash
npm install
npm run hooks:install
npm run lint
npm run typecheck
npm run test
```

Run apps:

```bash
npm run dev --workspace @contriskill/api
npm run dev --workspace @contriskill/web
```

## Key Engineering Docs

- `docs/03-engineering/mvp-implementation-blueprint.md`
- `docs/03-engineering/phase1-execution-plan.md`
- `docs/02-architecture/api-spec.md`
- `docs/02-architecture/database-design.md`
- `docs/01-product/contribution-engine.md`

## Operating Rule

Implementation work should follow the execution plan and keep unresolved policy items explicitly marked as `OPEN DECISION`.
