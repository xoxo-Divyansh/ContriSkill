# Realtime Collaboration Foundation

## Scope

This pack defines the realtime collaboration foundation for ContriSkill before any websocket runtime implementation begins.

## Realtime Goals

- Deliver low-latency visibility for contribution lifecycle changes.
- Keep API + database as source of truth.
- Preserve trust, auditability, and authorization boundaries.
- Enable phased rollout without blocking core product correctness.

## MVP Boundaries

### In Scope (Planning + future implementation target)

- Authenticated realtime transport layer.
- Contribution lifecycle event push (create/update/state transitions).
- Basic contribution-room presence model.
- Reconnect + replay-from-cursor behavior.
- Observability baseline for connection/event health.

### Out of Scope (Deferred)

- Collaborative editing.
- Chat/messaging channels.
- Notifications delivery system.
- AI recommendation/realtime automation.
- Moderation execution over realtime channels.

## Transport Philosophy

- Realtime is enhancement, never authority.
- Commands and business decisions remain HTTP/API-driven.
- Realtime streams only persisted, policy-approved events.
- Clients must tolerate disconnects and recover via API pull.

## Implementation Sequencing

1. Finalize contracts (`realtime-event-contracts.md`).
2. Build backend runtime boundaries (registry, broadcaster, auth hooks).
3. Add frontend realtime provider + reconnection flow.
4. Integrate contribution-list/detail realtime hydration.
5. Add observability and abuse safeguards.
6. Load/stress validation and rollout gates.

## Current Phase 3 Diagnostics Note

- A development diagnostics endpoint is now part of the realtime observability surface:
  - `GET /api/v1/internal/realtime/stats`
- The endpoint is explicitly non-production and intended for runtime debugging/triage only.
- It exposes aggregate counters and runtime health metadata only (no sensitive payload data).
- See `realtime-observability.md` for counter definitions and operator usage guidance.

## OPEN_DECISION

1. First production transport: WebSocket vs SSE fallback hybrid.
2. Required replay retention window for reconnect (minutes/hours).
3. Single gateway process vs dedicated realtime runtime boundary.
