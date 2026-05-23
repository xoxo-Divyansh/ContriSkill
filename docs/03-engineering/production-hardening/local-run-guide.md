# Local Run Guide

This guide is for first-time local startup with predictable environment behavior.

## 1) Install

```bash
npm install
```

## 2) Create local env files per app

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Windows PowerShell equivalent:

```powershell
Copy-Item apps/api/.env.example apps/api/.env.local
Copy-Item apps/web/.env.example apps/web/.env.local
```

## 3) Minimum values to run locally

- `apps/web/.env.local`
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` (required)
- `apps/api/.env.local`
  - `API_PORT=4000` (default)
  - `WS_CORS_ORIGIN=http://localhost:3000` (default)

Auth/database secrets are optional in local mode (`NODE_ENV=development`) and become required in `production`.

## 4) Run locally

```bash
npm run dev
```

or run each app separately:

```bash
npm run dev --workspace @contriskill/api
npm run dev --workspace @contriskill/web
```

## 5) Expected startup diagnostics

- API logs runtime-safe config presence flags (`hasDatabaseUrl`, `hasJwtAccessSecret`, etc.)
- Web logs validated env summary in non-production mode
- No secret values are ever printed

## 6) Validate before commit

```bash
npm run lint
npm run typecheck
npm run test
npm run ci
```
