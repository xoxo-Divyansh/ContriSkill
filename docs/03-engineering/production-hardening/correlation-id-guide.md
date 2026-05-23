# Correlation ID Guide

## Header Standard
- Primary header: `x-request-id`
- Accepted at API ingress when format is safe:
  - max length 128
  - allowed chars: `a-z`, `A-Z`, `0-9`, `_`, `-`
- If missing/invalid, API generates: `req_<uuid>`

## API Lifecycle
1. Correlation middleware resolves request ID.
2. Request logging middleware includes `correlationId` in start/end logs.
3. Response includes `x-request-id`.
4. Error envelopes include:
   - `meta.requestId`
   - `meta.timestamp`

## Frontend Behavior
- HTTP client sends `x-request-id` for every request.
- On API errors, frontend captures response `x-request-id` and stores it on normalized `ApiClientError.correlationId`.
- UI surfaces may display this value as support reference (without exposing internals).

## Realtime Tracing Direction
- Realtime client includes optional `cid` query param during websocket connect.
- Runtime keeps optional per-connection `correlationId` for safe diagnostics snapshots.
- This creates a bridge for API -> realtime investigation without exposing secrets.

## Troubleshooting
- Missing request ID in API response:
  - verify correlation middleware order before routers.
- Missing correlation ID in client error:
  - confirm API returned `x-request-id` header.
- Realtime sessions not traceable:
  - confirm client provides `cid` and runtime diagnostics include sample entries.
