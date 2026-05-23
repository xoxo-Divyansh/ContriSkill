# Env Troubleshooting Guide

## Error: Missing `NEXT_PUBLIC_API_BASE_URL`

Exact error:

```text
[env] Missing required environment variable "NEXT_PUBLIC_API_BASE_URL". Set it in apps/web/.env.local (see apps/web/.env.example).
```

Fix steps:

1. Ensure `apps/web/.env.local` exists.
2. Add `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
3. Restart the web dev server.

## Web loads but realtime URL is unexpected

When `NEXT_PUBLIC_REALTIME_URL` is omitted, web derives it from `NEXT_PUBLIC_API_BASE_URL`.

- API `http://localhost:4000` -> realtime `ws://localhost:4000/api/v1/realtime`
- API `https://api.example.com` -> realtime `wss://api.example.com/api/v1/realtime`

Set `NEXT_PUBLIC_REALTIME_URL` explicitly if you need a non-default websocket endpoint.

## API starts without DB/JWT secrets in local mode

This is expected in `development` and `test` for current foundation runtime behavior.

In `production`, missing `DATABASE_URL`, `JWT_ACCESS_SECRET`, or `JWT_REFRESH_SECRET` fails fast at startup.

## Worktree-specific env confusion

If values look stale after branch switching:

1. Verify you are in the expected worktree path.
2. Re-open `apps/api/.env.local` and `apps/web/.env.local` in that worktree.
3. Re-run app startup to trigger validation messages.
