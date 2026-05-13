# ContriSkill

ContriSkill is a trust-centered contribution platform. This repository is currently in **Sprint 1 foundation implementation** for Phase 1 MVP.

## Current State

Implemented foundations (Sprint 1 Steps 1-6):

- shared constants and contracts across workspaces
- typed environment validation for API and Web
- API auth scaffolding (module boundaries, routes, middleware guards, tests)
- Web API client foundation (typed HTTP client, error normalization, client shells)
- provider hierarchy foundation
- route group strategy and composable route wrappers

Not implemented yet:

- real auth persistence or OAuth flows
- contribution/reputation/messaging business logic
- database schema implementation and migrations
- product feature UI screens

## Monorepo Structure

```text
ContriSkill/
|-- apps/
|   |-- api/
|   `-- web/
|-- packages/
|   |-- config/
|   |-- contracts/
|   |-- domain/
|   |-- ui/
|   `-- utils/
|-- docs/
|   |-- 00-overview/
|   |-- 01-product/
|   |-- 02-architecture/
|   |-- 03-engineering/
|   |-- 04-design/
|   |-- 05-ai-workflow/
|   `-- adr/
|-- tooling/
|   `-- docker/
|-- tests/
|-- scripts/
`-- .github/
```

## Workspace Responsibilities

### `apps/api`

- HTTP server bootstrap and route mounting
- typed env loading and fail-fast validation
- auth foundation module:
  - `modules/auth/*`
  - `middleware/request-actor.ts`
  - `middleware/require-auth.ts`
  - `middleware/require-role.ts`

### `apps/web`

- Next.js app router shell
- typed env loading and fail-fast validation
- typed API transport/client layer
- provider composition and routing wrappers

### `packages/*`

- `packages/config`: shared config constants (including env keys)
- `packages/contracts`: shared API envelopes and API/error constants
- `packages/domain`: shared domain constants and state labels
- `packages/ui`: UI package foundation
- `packages/utils`: shared utility foundation

## Web Routing and Guards (Current)

Route groups:

- `(public)` -> public landing shell (`/home`)
- `(auth)` -> auth entry shell (`/sign-in`)
- `(app)` -> protected app shell (`/app`)

Root route strategy:

- `/` resolves target intent based on session (`/home` or `/app`) via route policy helper

Routing wrapper utilities:

- `src/lib/routing/require-auth.tsx`
- `src/lib/routing/redirect-if-auth.tsx`
- `src/lib/routing/require-role.tsx`
- `src/lib/routing/route-policy.ts`

## Provider Hierarchy (Current)

Root composition in `src/providers/app-providers.tsx`:

1. `EnvProvider`
2. `SessionProvider`
3. `ApiClientProvider`

This hierarchy is wired in `apps/web/src/app/layout.tsx`.

## Validation Workflow

Use root scripts for workspace-wide checks:

```bash
npm run lint
npm run typecheck
npm run test
```

Recommended full gate:

```bash
npm run ci
```

## Commands

Install:

```bash
npm install
npm run hooks:install
```

Development:

```bash
npm run dev
```

Run app workspaces individually:

```bash
npm run dev --workspace @contriskill/api
npm run dev --workspace @contriskill/web
```

Validation:

```bash
npm run lint
npm run typecheck
npm run test
```

## Key Documentation

- `docs/03-engineering/mvp-implementation-blueprint.md`
- `docs/03-engineering/phase1-execution-plan.md`
- `docs/03-engineering/sprint1-implementation-plan.md`
- `docs/03-engineering/sprint1-checklist.md`
- `docs/02-architecture/api-spec.md`
- `docs/02-architecture/database-design.md`
- `docs/01-product/contribution-engine.md`

## Contributor Note

Keep implementation aligned with the Sprint checklist and architecture docs. Mark unresolved policy or behavior decisions as `OPEN DECISION`.
