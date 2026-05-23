# Environment Setup Guide

## Canonical env templates

- Root reference: `.env.example`
- API template: `apps/api/.env.example`
- Web template: `apps/web/.env.example`

Use app-specific `.env.local` files as the executable source for local development.

## Required vs optional

### Web (`apps/web/.env.local`)

- Required:
  - `NEXT_PUBLIC_API_BASE_URL`
- Optional:
  - `NEXT_PUBLIC_APP_NAME` (defaults to `ContriSkill`)
  - `NEXT_PUBLIC_REALTIME_URL` (derived from API URL when omitted)

### API (`apps/api/.env.local`)

- Required in all environments:
  - `NODE_ENV` (defaults to `development` if omitted)
  - `LOG_LEVEL` (defaults to `info`)
  - `API_PORT` (defaults to `4000`)
  - `SESSION_TTL_MINUTES` (defaults to `30`)
  - `WS_CORS_ORIGIN` (defaults to `http://localhost:3000`)
- Optional in local/dev, required in production:
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`

## Realtime URL behavior

If `NEXT_PUBLIC_REALTIME_URL` is not set, web derives:

- `http://...` API -> `ws://.../api/v1/realtime`
- `https://...` API -> `wss://.../api/v1/realtime`

## Worktree reminder

Each git worktree should have its own `.env.local` files:

- `apps/api/.env.local`
- `apps/web/.env.local`

Do not copy secrets across unrelated worktrees without review.
