# Observability Runbook

## Purpose
Operational response guide for production-safe debugging using structured logs, request correlation IDs, and realtime diagnostics.

## What To Capture First
1. `x-request-id` from failing API response headers.
2. API route/method and UTC timestamp window.
3. Actor scope (anonymous/authenticated) without secrets/tokens.
4. If realtime is involved, reconnect behavior and approximate connection time.

## API Triage Flow
1. Locate `HTTP request started.` log with matching `correlationId`.
2. Find corresponding completion log:
   - `HTTP request completed.`
   - `HTTP request completed with client error.`
   - `HTTP request completed with server error.`
3. Confirm:
   - `statusCode`
   - `route`
   - `elapsedMs`
4. If server error path, collect generated `incidentId`.

## Realtime Triage Flow
1. Inspect realtime connection lifecycle logs:
   - connection accepted/rejected
   - reconnect replay restored/missed
2. Check diagnostics snapshot counters:
   - `connectionAttempts`
   - `connectionAccepted`
   - `unauthenticatedRejects`
   - `reconnectTokenMisses`
   - `subscriptionReplayFailures`
3. Review `activeConnectionSamples` for safe context:
   - `connectionId`
   - `actorType`
   - `role`
   - `connectedAt`
   - optional `correlationId`

## Safety Rules
- Never log raw session tokens, JWTs, passwords, or cookies.
- Share only request/correlation IDs and incident IDs with support channels.
- Keep diagnostics payloads non-sensitive and role-scoped.

## Escalation Triggers
- Sustained increase in `heartbeatTimeoutDisconnects`.
- Spike in `reconnectTokenMisses` or `subscriptionReplayFailures`.
- Repeated 5xx responses with elevated `elapsedMs` on a route family.
