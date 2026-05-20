# Current Platform Review

## 1) Current Platform Maturity

**Implemented Facts**

- ContriSkill is beyond bootstrap and now has working vertical foundations across auth/session, contribution domain, contribution API, and minimal web integration.
- Core CI hygiene is in place (`lint`, `typecheck`, `test`) with GitHub Actions execution (`.github/workflows/ci.yml`).
- Sprint 2 documentation exists and has started translating into runtime architecture.

**Planned / Not Fully Mature Yet**

- Realtime runtime is still planning-only.
- Moderation execution, reputation/credits settlement, notifications, and ranking are architecture-defined but not runtime-complete.
- Operational hardening (SLOs, tracing, production alerts, runbooks) is partial.

Maturity assessment: **early production-architecture stage** (strong foundation, selective vertical implementation, still pre-scale).

## 2) Implemented System Layers

**Implemented Facts**

- **Domain layer**: contribution state machine, policies, domain errors/events in `packages/domain/src/contribution/*`.
- **Application/service layer**: orchestration in API services (`apps/api/src/modules/contribution/service.ts`, auth services).
- **API/controller layer**: route/controller/contract mapping in auth + contribution modules.
- **Persistence layer**: DB-backed auth sessions, auth identities, contribution persistence migrations and repository implementations with fallback safety.
- **Frontend platform layer**: provider hierarchy, route guards, typed API clients, minimal protected app shell.
- **UI foundation layer**: design tokens + primitives in `packages/ui/src/*`.

**Planned / Incomplete**

- Dedicated event outbox/dispatcher runtime.
- Realtime transport/runtime layer.
- Advanced query/read models for discovery at scale.

## 3) Backend Architecture Review

**Implemented Facts**

- API uses modular structure: `auth`, `contribution`, middleware, config, db boundary.
- Security middleware chain exists (`request-actor`, `require-auth`, `require-capability`, `require-role`).
- Contribution module separates contracts/controller/service/repository/validation/unit-of-work.
- Auth runtime includes DB session store plus resilient memory fallback path.

**Strengths**

- Clear module boundaries and policy-first authorization.
- Typed error mapping and contract-safe responses.
- Runtime resilience design already started (DB fallback, structured logs).

**Weaknesses / Risks**

- `apps/api/src/server.ts` currently mounts business modules directly; no higher-level composition module yet.
- Some fallback behavior can mask persistent infra issues if alerting is weak.
- Event persistence exists, but integration-event dispatch lifecycle is not yet fully operationalized.

## 4) Frontend Architecture Review

**Implemented Facts**

- Next App Router with route groups `(public)`, `(auth)`, `(app)`.
- Provider chain: env -> session -> API client -> session bootstrap.
- Route wrappers (`require-auth`, `require-role`, `redirect-if-auth`) are present.
- Contribution browsing/detail pages call typed contribution client.
- UI primitives/tokens are actively used.

**Strengths**

- Good foundation separation between routing, providers, and API clients.
- Minimal but usable protected vertical slice.
- Contract-driven API consumption.

**Weaknesses / Risks**

- Session persistence is currently client-storage-based; this is practical for MVP dev but security posture is not final production-grade.
- Data-fetching is component-local; no standardized query cache strategy yet.
- Some UI copy/rendering artifacts indicate quick iteration (should be normalized before broader release).

## 5) Domain / Application / API Boundary Review

**Implemented Facts**

- Domain invariants live in `packages/domain` (state transitions + policy checks).
- Services orchestrate use-cases and emit events.
- Controllers are mostly thin and map HTTP to service contracts.

**Assessment**

- Boundary discipline is **strong** for current stage.
- Business logic is not heavily leaked into controllers/components.

**Risk**

- As features expand (moderation/reputation), boundary erosion risk rises unless strict review gates remain.

## 6) Persistence / Query Architecture Review

**Implemented Facts**

- Migrations exist for `auth_sessions`, `auth_identities`, and contribution persistence tables.
- Contribution tables include meaningful indexes for state/type/timeline access patterns.
- Query/list/detail contracts and routes are implemented.

**Planned / Gaps**

- No dedicated read-model projections for complex discovery/feed use-cases.
- No outbox-backed async persistence pipeline yet.
- Transaction strategy exists conceptually (unit-of-work boundary), but broader multi-aggregate consistency policies are still evolving.

## 7) Auth / Session / Authorization Review

**Implemented Facts**

- Registration/login flow backed by identity repository and password hashing boundary.
- Session create/resolve/rotate/revoke supported with hashed tokens.
- Capability matrix is centralized in `apps/api/src/modules/auth/capabilities.ts`.
- Authorization helpers and guard middleware are integrated.

**Strengths**

- Capability-based authorization direction is correct and extensible.
- Hashed token persistence is a strong baseline.
- Fallback runtime prevents full outage when DB path fails.

**Risks**

- Fallback mode can create behavioral divergence (DB vs memory) under fault conditions.
- Session transport strategy for web (cookie vs bearer canonical approach) still needs finalization.

## 8) Realtime Readiness Review

**Implemented Facts**

- Realtime architecture and implementation checklist are well-documented under `docs/03-engineering/realtime-foundation/*`.
- MVP boundaries are explicit and sensible.

**Not Implemented Yet**

- No websocket runtime, connection registry, subscription auth runtime, presence runtime, or frontend realtime provider.

**Readiness Assessment**

- **Planning readiness: high**.
- **Runtime readiness: medium** (auth/capability/event foundations are sufficient to start incremental implementation).

## 9) Testing / CI Confidence Review

**Implemented Facts**

- Multi-workspace tests exist across API, web, contracts, domain, ui, config, utils.
- CI pipeline runs install + lint + typecheck + tests.

**Confidence Level**

- **Good for foundation regressions**.

**Gaps**

- Limited end-to-end/system test coverage across API + web runtime integration under failure modes.
- No load/perf test harness yet (important before realtime rollout).

## 10) Current Architectural Risks

- Drift risk between docs claiming �planned� and runtime now partially implemented (README is behind current state).
- Growing complexity in auth/session fallback paths without matching ops telemetry maturity.
- Potential future coupling of contribution lifecycle and eventual moderation/reputation rules if not isolated early.
- Realtime introduction could create hidden consistency bugs if replay/cursor semantics are weak.

## 11) Coupling Risks

- API modules may become tightly coupled if cross-domain orchestration is added ad hoc.
- Frontend route components currently handle data + interaction + status logic together; this may become hard to evolve.
- Shared contract package can become a bottleneck if ownership/versioning discipline is weak.

## 12) Missing Operational Pieces

- Explicit runbooks for session-store fallback incidents.
- Formal SLO/SLA targets for auth and contribution APIs.
- Central metrics/tracing strategy (currently mostly structured logs + tests).
- Security rate-limit policy baseline for future realtime and public endpoints.

## 13) What Is Strong and Should Be Preserved

- Domain-first contribution modeling and policy enforcement.
- Capability-based authorization model.
- Layering discipline (domain/application/controller/repository).
- Typed contracts and test-driven guardrails.
- UI primitive/token-first frontend foundation.
- Documentation-first planning culture with OPEN_DECISION tracking.

## 14) What Should Not Be Implemented Yet

- Realtime chat or collaborative editing.
- Notification fanout system coupled to partially-mature event architecture.
- Reputation scoring engine and anti-fraud automation before moderation execution/audit hardening.
- Feed ranking/recommendation complexity before stable query/read-model foundations.

## 15) Recommended Next 3 Implementation Milestones

1. **Realtime MVP Runtime Foundation (bounded)**
   - Implement transport boundary, authenticated connection context, subscription auth, minimal presence, contribution live updates.
   - Keep HTTP/API authoritative and add replay-safe fallback.

2. **Event/Outbox + Operational Observability Hardening**
   - Introduce explicit integration-event dispatch boundary.
   - Add counters/alerts/runbooks for auth fallback, event dispatch failures, and reconnect anomalies.

3. **Query/Discovery Stabilization Before Ranking**
   - Solidify contribution retrieval read patterns (pagination/filter consistency, query contracts, cache strategy).
   - Delay ranking and recommendations until read consistency and moderation hooks are production-safe.

## 16) Decision Log / OPEN_DECISION List

1. Canonical web session transport strategy (`httpOnly` cookie vs bearer token as primary).
2. Realtime transport choice (WebSocket-only MVP vs WS+SSE fallback).
3. Cursor/replay format and retention window for realtime reconnect.
4. Realtime topology (in-process with API vs dedicated gateway) and extraction trigger.
5. Outbox/event dispatcher ownership and failure/retry semantics.
6. Capability expansion governance (who approves new capabilities and role mappings).
7. Production observability baseline (required metrics, thresholds, and incident escalation path).
8. Moderation/reputation coupling boundary and sequencing rules for trust-impacting events.

---

## Final Assessment

ContriSkill currently has **strong architectural bones** for a scalable modular monolith: clear boundaries, typed contracts, domain-driven rules, and practical test/CI foundations. The highest leverage path now is **controlled realtime introduction plus operational hardening**, while intentionally deferring advanced social/discovery systems until consistency, observability, and trust controls are fully stable.
