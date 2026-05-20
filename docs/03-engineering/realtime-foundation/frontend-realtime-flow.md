# Frontend Realtime Flow

## Objective

Define frontend realtime integration aligned with existing provider hierarchy, route boundaries, and API client architecture.

## Provider Structure

Recommended composition within app providers:

1. `EnvProvider`
2. `SessionProvider`
3. `ApiClientProvider`
4. `RealtimeProvider` (new, dependent on session + env)

Realtime provider responsibilities:

- connection lifecycle state
- subscription management
- event dispatch to feature-level handlers
- reconnect + replay orchestration

## Reconnect Flow

1. Detect disconnect/error.
2. Enter `reconnecting` state with backoff.
3. Revalidate session (or use current actor snapshot).
4. Reconnect transport.
5. Resubscribe channels.
6. Request replay from last cursor.
7. Return to `connected`.

## Auth/Session Synchronization

- Realtime provider consumes normalized actor/session from SessionProvider.
- On logout/session revoke:
  - immediate disconnect
  - clear subscriptions and cursors.
- On login/session refresh:
  - initialize new connection context.

## Optimistic vs Server-Driven Updates

- Commands remain API-first.
- UI may render optimistic hints for local responsiveness.
- Canonical state settles from API response and/or realtime confirmed event.
- If optimistic and server event conflict, server state wins.

## Event Hydration Boundaries

- Realtime updates should hydrate:
  - contribution list/status badges
  - contribution detail timeline/status
- Realtime should not directly mutate unrelated domains.
- If cursor gap or mismatch is detected, trigger API refetch for affected views.

## Error Handling

- Transport errors mapped to non-blocking UI alerts where possible.
- Auth-related realtime errors trigger session recovery/logout flow.
- Silent retries allowed for transient network errors within bounded attempts.

## MVP vs Deferred

### MVP

- Connection status support.
- Contribution list/detail hydration updates.
- Bounded reconnect + replay logic.

### Deferred

- Global event bus for all domains.
- Offline queue synchronization.
- Advanced optimistic conflict reconciliation.

## OPEN_DECISION

1. Keep provider-internal state vs introduce shared store for realtime slices.
2. How many reconnect attempts before hard-fail UX state.
3. Whether to render connection status globally or route-local only.
