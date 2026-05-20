# Realtime Collaboration Foundation — Implementation Checklist

## Purpose

Sprint-ready execution checklist for implementing the ContriSkill realtime foundation with minimal MVP scope and strict architecture boundaries.

## Scope Guardrails

- Realtime is enhancement only; API + DB remain source of truth.
- Keep mutation/command flow on HTTP APIs.
- Keep transport/runtime modular and capability-enforced.
- Do not expand into chat, collaborative editing, notifications, or AI automation.

---

## Phase 0 — Preconditions

### Tasks

- Verify auth/session runtime is stable for actor resolution and revocation flow.
- Verify contribution lifecycle events required for realtime emission exist and are consistent.
- Verify frontend provider chain readiness: env -> session -> API client -> realtime (planned).
- Verify local dev setup supports concurrent API + web runtime.

### Done Criteria

- Session actor model is contract-stable for socket handshake use.
- Contribution event sources for create/update/state transitions are identified.
- Provider integration point is documented and agreed.
- Team can run baseline lint/typecheck/test/ci cleanly.

### Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run ci`

### Files Likely Touched

- `docs/03-engineering/realtime-foundation/*.md`
- `docs/00-overview/codex-context-refresh.md` (only if context status needs update)

### DO NOT IMPLEMENT YET

- WebSocket runtime code.
- Frontend realtime provider code.
- Event broadcaster runtime.

---

## Phase 1 — Backend Realtime Transport Foundation

### Tasks

- Introduce transport boundary interfaces (no domain logic inside transport handlers).
- Add connection registry boundary and in-memory MVP implementation.
- Add authenticated connection context resolution using existing auth/session model.
- Add heartbeat/ping-pong handling and disconnect cleanup.
- Add baseline transport tests (lifecycle, connect/disconnect, stale cleanup).

### Done Criteria

- Transport layer compiles behind explicit abstraction.
- Connection context always resolves actor/session or rejects connection.
- Stale/disconnected connections are removed deterministically.
- Basic runtime tests pass for handshake + lifecycle behavior.

### Validation Commands

- `npm run lint --workspace @contriskill/api`
- `npm run typecheck --workspace @contriskill/api`
- `npm run test --workspace @contriskill/api`

### Files Likely Touched

- `apps/api/src/realtime/*` (new module boundary)
- `apps/api/src/modules/auth/*` (handshake/session integration points)
- `apps/api/tests/*realtime*`

### DO NOT IMPLEMENT YET

- Distributed pub/sub fanout.
- Multi-node connection coordination.
- Moderator/global realtime channels unless strictly required for MVP.

---

## Phase 2 — Realtime Event Contracts

### Tasks

- Define shared event envelope and naming convention implementation contracts.
- Add event payload validation rules (runtime-safe input/output boundaries).
- Add event version tagging strategy (`v1` baseline).
- Implement contribution-room event categories for MVP.

### Done Criteria

- Event names follow documented convention consistently.
- Payload validation exists for publish path.
- Version field is present and enforced.
- Contract tests cover invalid payload/name/version rejection.

### Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test --workspace @contriskill/api`
- `npm run test --workspace @contriskill/contracts`

### Files Likely Touched

- `packages/contracts/src/realtime/*` (or equivalent shared contract location)
- `apps/api/src/realtime/contracts/*`
- `apps/api/tests/*event-contract*`

### DO NOT IMPLEMENT YET

- Broad cross-domain event streams.
- Historical replay APIs beyond MVP cursor replay window.
- Advanced schema registry infrastructure.

---

## Phase 3 — Presence MVP

### Tasks

- Implement contribution-room presence state model (online/offline MVP baseline).
- Add join/leave presence events scoped to authorized room members.
- Implement heartbeat stale-expiry cleanup flow.
- Implement reconnect restoration behavior (resubscribe + replay trigger contract).

### Done Criteria

- Presence reflects active authorized room participants only.
- Stale sessions are purged predictably.
- Reconnect flow restores room presence without duplication leaks.
- Presence tests cover join/leave/stale/reconnect paths.

### Validation Commands

- `npm run lint --workspace @contriskill/api`
- `npm run typecheck --workspace @contriskill/api`
- `npm run test --workspace @contriskill/api`

### Files Likely Touched

- `apps/api/src/realtime/presence/*`
- `apps/api/src/realtime/registry/*`
- `apps/api/tests/*presence*`

### DO NOT IMPLEMENT YET

- Typing indicators.
- Collaborative edit cursors.
- Presence analytics dashboards.

---

## Phase 4 — Frontend Realtime Provider

### Tasks

- Implement websocket client boundary abstraction in web app.
- Add `RealtimeProvider` integrated after session/API providers.
- Implement provider connection state (`connecting`, `connected`, `reconnecting`, `disconnected`).
- Implement reconnect strategy with backoff and cursor replay request.
- Synchronize connect/disconnect with auth session lifecycle and route boundaries.

### Done Criteria

- Provider composes cleanly within current app provider hierarchy.
- Session logout/revocation disconnects realtime deterministically.
- Route-level consumers can subscribe via provider-safe APIs.
- Frontend tests cover connection-state and auth-sync behavior.

### Validation Commands

- `npm run lint --workspace @contriskill/web`
- `npm run typecheck --workspace @contriskill/web`
- `npm run test --workspace @contriskill/web`

### Files Likely Touched

- `apps/web/src/providers/realtime-provider.tsx` (new)
- `apps/web/src/lib/realtime/*`
- `apps/web/src/providers/app-providers.tsx`
- `apps/web/tests/*realtime*`

### DO NOT IMPLEMENT YET

- Global client event bus for all domains.
- Offline-first sync engine.
- Heavy state management library migration.

---

## Phase 5 — Minimal Contribution Live Updates

### Tasks

- Wire contribution created/updated/state-changed events into frontend list/detail surfaces.
- Add room/list subscription boundaries aligned to auth capability scope.
- Implement safe UI patch strategy:
  - apply event updates when consistent
  - fallback to API refetch on cursor gap/conflict.

### Done Criteria

- Contribution list updates without full-page reload.
- Contribution detail reflects lifecycle updates reliably.
- Conflicting/missed events trigger safe refetch behavior.
- Existing creation/update flows remain stable.

### Validation Commands

- `npm run lint --workspace @contriskill/web`
- `npm run typecheck --workspace @contriskill/web`
- `npm run test --workspace @contriskill/web`
- `npm run test --workspace @contriskill/api`

### Files Likely Touched

- `apps/web/src/app/(app)/app/contributions/*`
- `apps/web/src/lib/realtime/*`
- `apps/api/src/modules/contribution/*` (event emission integration only)

### DO NOT IMPLEMENT YET

- Feed ranking/discovery streaming.
- Notifications push flows.
- Realtime moderation or reputation scoring updates.

---

## Phase 6 — Security + Capability Enforcement

### Tasks

- Enforce auth validation at connect and reconnect.
- Enforce subscription authorization using capability mapping.
- Add basic flood controls (connection/subscription/message rate limits).
- Add payload sanitation and sensitive field exclusion checks.

### Done Criteria

- Unauthorized connections/subscriptions fail closed with structured errors.
- Capability checks are centralized and test-covered.
- Flood protections prevent trivial abuse without blocking normal usage.
- Sensitive fields are never emitted in realtime payloads.

### Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test --workspace @contriskill/api`
- `npm run ci`

### Files Likely Touched

- `apps/api/src/realtime/security/*`
- `apps/api/src/modules/auth/capabilities.ts`
- `apps/api/tests/*realtime-security*`

### DO NOT IMPLEMENT YET

- Advanced bot/fraud heuristics.
- Adaptive behavioral scoring.
- Regional policy-routing complexity.

---

## Phase 7 — Observability + Stabilization

### Tasks

- Add structured logs for connect/disconnect/auth/subscription failures.
- Add baseline counters: active connections, publish rate, error rate, reconnect rate.
- Add disconnect/reconnect reason tracking.
- Add runtime smoke checks for local API + web integration.
- Ensure full validation pipeline passes.

### Done Criteria

- Operational logs can diagnose realtime failures quickly.
- Core counters expose basic health and regression signals.
- Reconnect behavior is visible and measurable.
- CI is green with realtime foundation enabled.

### Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run ci`
- Manual runtime checks:
  - API health endpoint
  - contribution list/detail realtime update flow
  - forced disconnect + reconnect recovery

### Files Likely Touched

- `apps/api/src/realtime/observability/*`
- `apps/api/src/utils/logger*` (if extension required)
- `apps/web/src/lib/realtime/*` (client diagnostics hooks)
- `apps/api/tests/*realtime-observability*`

### DO NOT IMPLEMENT YET

- Full distributed tracing stack rollout.
- SLO automation and paging policy expansion.
- Realtime analytics product surfaces.

---

## Cross-Phase MVP Boundary Rules

- Keep realtime additive to existing HTTP contracts.
- Keep domain rules in domain/application layers, not socket handlers.
- Keep authorization server-authoritative and capability-based.
- Keep all realtime payloads minimal and privacy-safe.

---

## OPEN_DECISION

1. Primary transport choice for first rollout: pure WebSocket vs WebSocket+SSE fallback.
2. Cursor strategy: opaque signed token vs structured checkpoint token.
3. Replay retention window duration and storage strategy.
4. Realtime runtime topology: in-process API module vs separate gateway.
5. Initial rate-limit thresholds by actor/session/IP for MVP.
6. Ordered delivery requirement per channel for MVP vs eventual consistency with refetch fallback.
7. Presence granularity at MVP: online/offline only vs include idle.
