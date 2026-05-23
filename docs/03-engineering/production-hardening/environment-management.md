# Environment Management

## Objectives
- ensure deterministic config across local/dev/preview/prod
- prevent secret leakage
- standardize environment validation before runtime

## Required Environment Variables (MVP Baseline)
Define and maintain a canonical variable inventory in `.env.example` and environment docs.

Core runtime:
- `NODE_ENV`
- `APP_ENV` (`local|dev|preview|prod`)
- `APP_BASE_URL`
- `API_BASE_URL`

Auth/session:
- `SESSION_SECRET`
- `AUTH_PROVIDER_URL` (if external auth is used)
- `AUTH_PROVIDER_CLIENT_ID`
- `AUTH_PROVIDER_CLIENT_SECRET`

Persistence:
- `DATABASE_URL`
- `DATABASE_POOL_MIN`
- `DATABASE_POOL_MAX`

Observability/error reporting:
- `LOG_LEVEL`
- `ERROR_TRACKING_DSN` (if enabled)
- `DIAGNOSTICS_ENABLED` (`false` in production by default)

Realtime/collaboration transport (if applicable):
- `REALTIME_ENDPOINT`
- `REALTIME_AUTH_TOKEN`

## `.env.example` Strategy
MVP:
- include all required keys with placeholder values only
- annotate each key with short comments on purpose and format
- include environment-specific notes where defaults differ
- never include real secrets or production endpoints

Deferred:
- generate `.env.example` from schema metadata automatically
- enforce drift checks between schema and `.env.example` in CI

## Environment Separation Model
- `local`: developer machine defaults, mock or low-risk resources
- `dev`: shared integration environment for team QA
- `preview`: branch/PR-scoped staging-like environment
- `prod`: customer-facing production environment

Rules:
- no shared secrets between environments
- no direct production secret reuse in lower environments
- preview uses isolated credentials where feasible

## Secret Handling Rules
MVP:
- secrets only in secret manager or CI/CD protected variables
- never committed to git, docs, screenshots, or logs
- rotate compromised secrets immediately
- least-privilege credentials by environment

Deferred:
- automated periodic rotation policies
- secret access audit reporting dashboards

## Validation Expectations
MVP:
- validate required vars at startup before serving traffic
- fail fast with actionable, non-secret error messages
- validate type/format constraints (URLs, enums, numeric ranges)

Deferred:
- centralized schema package shared by web/API services
- CI preflight job that verifies required variable coverage per environment

## Worktree-Specific Environment Reminders
- each git worktree should have isolated `.env.local` and `.env.override`
- never symlink shared secret files across unrelated worktrees
- re-run env validation when switching branches with config changes
- keep branch-specific preview env keys documented in PR description

## MVP vs Deferred Summary
MVP:
- canonical `.env.example`
- strict required-var validation
- clear environment separation and secret handling rules

Deferred:
- schema-driven env generation
- automated env drift detection and secret rotation automation

## OPEN_DECISION
- Final source of truth for env schema: app code, docs, or dedicated config package.
- Whether preview environments are per-PR ephemeral or pooled shared environments.
- Whether `DIAGNOSTICS_ENABLED` should be compile-time only or runtime-toggleable.
