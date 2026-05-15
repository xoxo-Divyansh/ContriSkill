# Codex Context Refresh

## Purpose

Persistent onboarding and context-refresh document for future Codex/ChatGPT sessions working in ContriSkill.

## 1) Repository Overview

- Repository: `D:/Dev/src/products/ContriSkill`
- Platform: ContriSkill (trust-centered contribution ecosystem).
- Current stage: Sprint 1 foundation implemented; Sprint 2 planning documents prepared.
- Engineering mode: production-oriented incremental build, policy-first for trust systems.

## 2) Product Vision Summary

- Users build identity through meaningful contributions.
- Trust is earned through verification, collaboration outcomes, and transparent history.
- Credits/reputation are governed by auditable, policy-driven events.
- Moderation and dispute handling protect ecosystem integrity.

## 3) Current Architecture State

- Implemented: monorepo bootstrap + platform foundations (no core product business flows yet).
- Planned: auth hardening, lifecycle enforcement, real trust/ledger workflows, moderation execution logic.
- Principle: scalable modular monolith first; defer microservice split until operational need.

## 4) Monorepo Structure Summary

- `apps/api`: API server foundation, middleware/route scaffolding.
- `apps/web`: Next.js web foundation, provider/routing shells.
- `packages/*`: shared contracts/constants/config/ui primitives.
- `docs/*`: product/architecture/engineering/design governance source of truth.
- `.github/*`: issue/PR templates and CI workflow baseline.

## 5) Shared Package Responsibilities

- `packages/config`: shared environment key contracts and configuration constants.
- `packages/contracts` (if present): cross-boundary API/domain contract types.
- `packages/ui`: design tokens + reusable primitives + theme provider shell.
- `packages/*` rule: no app-specific business coupling; keep interfaces reusable.

## 6) Sprint 1 Completed Foundations

- Shared constants/contracts baseline.
- Typed env validation (API + Web) with fail-fast loading.
- API auth scaffolding (module boundaries, routes/controllers, guard middleware shells).
- Web API client foundation (typed HTTP + error normalization + client shells).
- Provider hierarchy foundation.
- Route group strategy + protected-route wrappers.
- UI design tokens + primitive UI foundation.
- Sprint 1 stabilization pass completed.

## 7) Sprint 2 Planning Status

- Planning pack created in `docs/03-engineering/sprint2/`.
- Includes roadmap, auth architecture, lifecycle rules, DB relationship validation, events, roles/permissions, moderation boundaries, AI boundaries.
- Status: planning complete, implementation not started.

## 8) Current Design-System Philosophy

- Calm, professional, trust-oriented interface direction.
- Strong spacing/typography rhythm and soft elevation.
- Reusable primitive-first composition over page-specific styling.
- Token-driven consistency across apps.

## 9) Current Routing/Provider Architecture

- Route groups: `(public)`, `(auth)`, `(app)`.
- Wrapper utilities: require-auth, redirect-if-auth, require-role shells.
- Provider composition: env provider + API client provider + session provider shell.
- Security note: web wrappers are UX gates; API remains enforcement boundary.

## 10) Current Auth Strategy Direction

- Direction: server-authoritative session model with revocation and actor injection.
- Planned transport: secure cookie-based session handling.
- API policy chain: request actor -> auth guard -> role/policy guard.
- Current state: scaffolding exists; real auth/session persistence deferred.

## 11) Current DB Architecture Direction

- Direction: auditable relational model for users, contributions, collaborations, verification, reviews, credits, reputation, moderation, audit logs.
- Ledger/event principles: append-only for trust-impacting records.
- Focus: explicit constraints, idempotent settlement boundaries, query-driven indexing.
- Current state: architecture docs defined; schema implementation deferred.

## 12) Current Moderation/AI Boundary Direction

- Moderation: policy-bounded actions with mandatory audit trail.
- AI: advisory-only direction for future phases; no autonomous trust decisions.
- Human review required for verification outcomes, moderation resolutions, trust penalties.

## 13) Current Validation Workflow

- Baseline commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run dev`
- Use workspace-scoped runs for focused checks when needed.
- Validate after each bounded step to keep integration stable.

## 14) Branch Strategy / Workflow

- Create focused branches per sprint step or bounded scope.
- Keep commits small, dependency-ordered, and reversible.
- Rebase/merge main frequently to reduce drift.
- Documentation and implementation changes should be traceable to checklist steps.

## 15) Commit / PR Conventions

- Use concise conventional-style intent (aligned with repo docs).
- PRs must include:
  - what changed,
  - why,
  - validation run/output,
  - deferred items/open decisions.
- Do not overstate completion; clearly separate implemented vs planned.

## 16) Runtime / Dev Commands

- Install: `npm install`
- Dev (all workspaces): `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Web-only test example: `npm run test --workspace @contriskill/web`

## 17) Important Implementation Constraints

- Do not mix feature delivery with foundation-only steps.
- Preserve monorepo boundaries and shared package discipline.
- API security checks must live server-side, never web-only.
- Keep trust/ledger/reputation paths deterministic and auditable.

## 18) Explicitly Deferred Systems

- Real auth persistence details (beyond current scaffold).
- OAuth/social login.
- Full contribution engine execution logic.
- Messaging/realtime collaboration features.
- Advanced reputation scoring and anti-fraud automation.
- Production deployment hardening beyond current baseline.

## 19) Current Recommended Implementation Order

1. Finalize Sprint 2 policy decisions (`OPEN DECISION` closure pass).
2. Implement real auth/session lifecycle in API + web integration.
3. Implement core DB schema + migration baseline aligned with lifecycle.
4. Implement contribution lifecycle endpoints/services with guard enforcement.
5. Add verification/dispute/moderation execution flows + audit guarantees.
6. Add settlement flows (credits/reputation) with idempotency.
7. Add notification/outbox and observability instrumentation.

## 20) Do Not Implement Yet

- Automated trust penalties.
- AI-driven verification or moderation outcomes.
- Complex multi-party settlement logic.
- Feature-rich dashboards/pages before lifecycle backend integrity is in place.

## 21) Safe Startup Checklist for New Codex Sessions

- Confirm branch and `git status` clean state.
- Read current `README.md`.
- Read Sprint 1 checklist + Sprint 2 planning pack.
- Identify requested scope and ensure no prohibited system is touched.
- Update plan first for multi-step tasks.
- Execute smallest valid increment and run required validation commands.
- Summarize changed files + remaining open decisions.

## Reusable Refresh Prompt

Use this prompt at session start:

> Refresh ContriSkill repository context from `D:/Dev/src/products/ContriSkill` in read-only mode.  
> Review `README.md`, `docs/00-overview/*`, `docs/01-product/*`, `docs/02-architecture/*`, `docs/03-engineering/*`, `docs/04-design/*`, `apps/api/*`, `apps/web/*`, `packages/*`, `.github/*`, and root configs.  
> Produce IMPLEMENTED vs PLANNED status, open decisions, current safe next step, systems not ready, and recommended next branch/prompt.

## Key References

- `D:/Dev/src/products/ContriSkill/README.md`
- `D:/Dev/src/products/ContriSkill/docs/01-product/product-spec.md`
- `D:/Dev/src/products/ContriSkill/docs/01-product/contribution-engine.md`
- `D:/Dev/src/products/ContriSkill/docs/02-architecture/database-design.md`
- `D:/Dev/src/products/ContriSkill/docs/02-architecture/api-spec.md`
- `D:/Dev/src/products/ContriSkill/docs/03-engineering/mvp-implementation-blueprint.md`
- `D:/Dev/src/products/ContriSkill/docs/03-engineering/phase1-execution-plan.md`
- `D:/Dev/src/products/ContriSkill/docs/03-engineering/sprint1-checklist.md`
- `D:/Dev/src/products/ContriSkill/docs/03-engineering/sprint2/README.md`
- `D:/Dev/src/products/ContriSkill/docs/04-design/design-direction.md`

## Recommended Reading Order

1. `README.md`
2. `docs/00-overview/codex-context-refresh.md`
3. `docs/01-product/contribution-engine.md`
4. `docs/02-architecture/database-design.md`
5. `docs/02-architecture/api-spec.md`
6. `docs/03-engineering/mvp-implementation-blueprint.md`
7. `docs/03-engineering/phase1-execution-plan.md`
8. `docs/03-engineering/sprint1-checklist.md`
9. `docs/03-engineering/sprint2/README.md`
10. `docs/04-design/design-direction.md`
