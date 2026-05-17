# Frontend Integration Strategy

## Objective

Define how the web app should integrate with current API/auth/contribution foundations while keeping feature delivery incremental and stable.

## API Consumption Direction

- Continue using typed API client module boundaries.
- Keep transport concerns centralized (`http-client`, error normalization).
- Keep feature clients thin and contract-focused.

## State Management Boundaries

- Server state:
  - fetched via API clients
  - cached with explicit invalidation/revalidation policy
- UI-local state:
  - form state
  - interaction toggles
  - optimistic rendering state (where safe)
- Do not mix server state with global mutable singleton stores prematurely.

## Auth/Session Frontend Integration

- Session source of truth remains API runtime.
- Web session provider resolves actor/session from API endpoints.
- Route wrappers are UX boundaries only; API enforcement remains authoritative.

## Route Protection Strategy

- `(public)`: no session required.
- `(auth)`: redirect authenticated actors away from sign-in/sign-up.
- `(app)`: require authenticated actor and policy-compatible role.
- Protected route decisions should use normalized actor model from provider.

## Caching/Revalidation Direction

- Short-lived cache for feed/list surfaces.
- Explicit invalidate-after-mutation for contribution commands.
- Background revalidation for collaboration status/presence-sensitive surfaces.

## Error/Conflict UX Direction

- Map API error codes to predictable UI actions:
  - `UNAUTHENTICATED` -> session recovery
  - `FORBIDDEN` -> capability messaging
  - `STATE_CONFLICT` -> refresh and show lifecycle context
  - `VALIDATION_ERROR` -> field-level guidance

## MVP vs Evolution

### MVP/near-term

- feature clients for contribution lifecycle surfaces.
- role-aware route shells.
- consistent API error handling and refresh behavior.

### Deferred

- advanced optimistic concurrency reconciliation UI.
- offline-first contribution workflows.

## OPEN_DECISION

1. Select canonical server-state library approach for long-term scale.
2. Decide whether actor/session should be polled or event-updated first.
3. Define conflict-resolution UX for multi-actor concurrent edits.
