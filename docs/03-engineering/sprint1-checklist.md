# Sprint 1 Engineering Checklist

- **Purpose:** Track Sprint 1 engineering execution with dependency-aware, commit-safe implementation order.
- **Owner:** Engineering + Architecture
- **Status:** Ready for execution
- **Related docs:** `sprint1-implementation-plan.md`, `phase1-execution-plan.md`, `mvp-implementation-blueprint.md`

## Implementation Guardrails

- [ ] Keep scope limited to Sprint 1 foundation only.
- [ ] Use shared constants/contracts before app-specific literals.
- [ ] Enforce API contract-first flow between backend and frontend.
- [ ] Keep changes incremental and commit-safe (one logical scope per commit).
- [ ] Run validation commands after each major step.
- [ ] Keep unresolved design/policy areas marked as `OPEN DECISION`.

## DO NOT IMPLEMENT YET (Deferred Systems)

- [ ] Contribution engine feature logic
- [ ] Messaging feature logic
- [ ] Reputation feature logic
- [ ] Moderation business workflows
- [ ] Database schema implementation
- [ ] Product UI screens beyond placeholder shells

## Step 0: Baseline Verification

**Depends on:** none

- [ ] Confirm CI baseline is green on foundation branch.
- [ ] Confirm root lint/typecheck/test scripts execute.
- [ ] Freeze Sprint 1 contract scope before branch fan-out.

### Checkpoint

- [ ] `npm run ci`

---

## Step 1: Shared Constants and Contracts Baseline

**Depends on:** Step 0

- [ ] Create `packages/domain/src/constants/roles.ts`.
- [ ] Create `packages/domain/src/constants/session.ts`.
- [ ] Create `packages/domain/src/constants/auth.ts`.
- [ ] Update `packages/domain/src/index.ts` exports.
- [ ] Create `packages/contracts/src/constants/api-errors.ts`.
- [ ] Create `packages/contracts/src/constants/http.ts`.
- [ ] Update `packages/contracts/src/index.ts` exports.
- [ ] Create `packages/config/src/constants/env-keys.ts`.
- [ ] Update `packages/config/src/index.ts` exports.

### Checkpoint

- [ ] `npm run lint`
- [ ] `npm run typecheck`

---

## Step 2: Environment Validation Foundation

**Depends on:** Step 1

- [ ] Create `apps/api/src/config/env-schema.ts`.
- [ ] Update/create `apps/api/src/config/env.ts` typed parser/validator.
- [ ] Ensure `apps/api/src/index.ts` validates env at bootstrap.
- [ ] Create `apps/web/src/config/env-schema.ts`.
- [ ] Update/create `apps/web/src/config/env.ts` typed public env object.
- [ ] Align required keys in `.env.example`.
- [ ] Sync keys with `packages/config/src/constants/env-keys.ts`.
- [ ] Update `README.md` env section if key list changes.

### Checkpoint

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`

---

## Step 3: API Auth Foundation (No Business Logic)

**Depends on:** Steps 1-2

- [ ] Create `apps/api/src/modules/auth/types.ts`.
- [ ] Create `apps/api/src/modules/auth/contracts.ts`.
- [ ] Create `apps/api/src/modules/auth/service.ts` (interface/stub only).
- [ ] Create `apps/api/src/modules/auth/controller.ts` (contract-safe responses only).
- [ ] Create `apps/api/src/modules/auth/routes.ts`.
- [ ] Create `apps/api/src/modules/auth/policies.ts`.
- [ ] Create `apps/api/src/middleware/request-actor.ts`.
- [ ] Create `apps/api/src/middleware/require-auth.ts`.
- [ ] Create `apps/api/src/middleware/require-role.ts`.
- [ ] Mount auth routes in `apps/api/src/server.ts`.
- [ ] Add/update auth route and guard shape tests in `apps/api/tests/*`.

### Checkpoint

- [ ] `npm run lint --workspace @contriskill/api`
- [ ] `npm run typecheck --workspace @contriskill/api`
- [ ] `npm run test --workspace @contriskill/api`

---

## Step 4: API Client Foundation (Web)

**Depends on:** Steps 1-3

- [ ] Create `apps/web/src/lib/api/http-client.ts`.
- [ ] Create `apps/web/src/lib/api/error-normalizer.ts`.
- [ ] Create `apps/web/src/lib/api/types.ts`.
- [ ] Create `apps/web/src/lib/api/auth-client.ts`.
- [ ] Create `apps/web/src/lib/api/user-client.ts`.
- [ ] Create `apps/web/src/lib/api/index.ts`.
- [ ] Add/update client parsing/error tests in `apps/web/tests/*`.

### Checkpoint

- [ ] `npm run lint --workspace @contriskill/web`
- [ ] `npm run typecheck --workspace @contriskill/web`
- [ ] `npm run test --workspace @contriskill/web`

---

## Step 5: Provider Hierarchy Foundation

**Depends on:** Steps 2 and 4

- [ ] Create `apps/web/src/providers/env-provider.tsx`.
- [ ] Create `apps/web/src/providers/session-provider.tsx`.
- [ ] Create `apps/web/src/providers/api-client-provider.tsx`.
- [ ] Create `apps/web/src/providers/app-providers.tsx` with canonical order.
- [ ] Wire `AppProviders` in `apps/web/src/app/layout.tsx`.
- [ ] Add `apps/web/src/types/session.ts` if needed for provider contracts.

### Checkpoint

- [ ] `npm run lint --workspace @contriskill/web`
- [ ] `npm run typecheck --workspace @contriskill/web`

---

## Step 6: Route Groups and Protected Route Shell

**Depends on:** Step 5

- [ ] Create `apps/web/src/app/(public)/page.tsx`.
- [ ] Create `apps/web/src/app/(auth)/sign-in/page.tsx`.
- [ ] Create `apps/web/src/app/(app)/layout.tsx`.
- [ ] Create `apps/web/src/lib/routing/route-policy.ts`.
- [ ] Create `apps/web/src/lib/routing/require-auth.tsx`.
- [ ] Create `apps/web/src/lib/routing/redirect-if-auth.tsx`.
- [ ] Create `apps/web/src/lib/routing/require-role.tsx`.
- [ ] Update `apps/web/src/app/page.tsx` routing entry behavior if needed.
- [ ] Add route/guard tests in `apps/web/tests/*`.

### Checkpoint

- [ ] `npm run lint --workspace @contriskill/web`
- [ ] `npm run typecheck --workspace @contriskill/web`
- [ ] `npm run test --workspace @contriskill/web`

---

## Step 7: Design System Tokens Foundation

**Depends on:** Step 1 (can run parallel to Steps 5-6, but merge after Step 6)

- [ ] Create `packages/ui/src/tokens/colors.ts`.
- [ ] Create `packages/ui/src/tokens/spacing.ts`.
- [ ] Create `packages/ui/src/tokens/typography.ts`.
- [ ] Create `packages/ui/src/tokens/radius.ts`.
- [ ] Create `packages/ui/src/tokens/shadows.ts`.
- [ ] Create `packages/ui/src/tokens/index.ts`.
- [ ] Create `packages/ui/src/providers/theme-provider.tsx`.
- [ ] Update `packages/ui/src/index.tsx` exports.

### Checkpoint

- [ ] `npm run lint --workspace @contriskill/ui`
- [ ] `npm run typecheck --workspace @contriskill/ui`
- [ ] `npm run test --workspace @contriskill/ui`

---

## Step 8: UI Primitive Foundation

**Depends on:** Step 7

- [ ] Create `packages/ui/src/primitives/button.tsx`.
- [ ] Create `packages/ui/src/primitives/input.tsx`.
- [ ] Create `packages/ui/src/primitives/label.tsx`.
- [ ] Create `packages/ui/src/primitives/card.tsx`.
- [ ] Create `packages/ui/src/primitives/stack.tsx`.
- [ ] Create `packages/ui/src/primitives/container.tsx`.
- [ ] Create `packages/ui/src/primitives/text.tsx`.
- [ ] Create `packages/ui/src/primitives/index.ts`.
- [ ] Update `packages/ui/src/index.tsx` re-exports.
- [ ] Add primitive tests in `packages/ui/tests/*`.

### Checkpoint

- [ ] `npm run lint --workspace @contriskill/ui`
- [ ] `npm run typecheck --workspace @contriskill/ui`
- [ ] `npm run test --workspace @contriskill/ui`

---

## Step 9: Sprint 1 Integration and Documentation Pass

**Depends on:** Steps 1-8

- [ ] Validate provider + routing + API client integration consistency.
- [ ] Validate shared constant usage across web/api packages.
- [ ] Update Sprint 1 status in `docs/03-engineering/sprint1-implementation-plan.md`.
- [ ] Update `README.md` foundation notes if needed.
- [ ] Confirm deferred systems remain untouched.

### Final Checkpoint

- [ ] `npm run ci`

---

## Recommended Commit Sequence

- [ ] `chore(shared): add auth/session/role/api constants`
- [ ] `chore(config): add typed env validation for web and api`
- [ ] `chore(api): scaffold auth module and auth middleware contracts`
- [ ] `chore(web): add typed api client core and auth/user client shells`
- [ ] `chore(web): add provider hierarchy foundation`
- [ ] `chore(web): add route groups and protected route wrappers`
- [ ] `chore(ui): add design tokens and theme provider`
- [ ] `chore(ui): add primitive component foundation`
- [ ] `docs(engineering): update sprint1 execution status`

---

## Definition of Done (Sprint 1)

- [ ] Shared role/session/api-error constants implemented and consumed by web and api.
- [ ] Environment validators exist for web and api with fail-fast behavior.
- [ ] Auth/session foundation module contracts exist without feature business logic.
- [ ] Provider hierarchy is wired and documented in web root.
- [ ] Route groups and protected route strategy are implemented with policy map.
- [ ] API client core and auth/user client shells are typed and integrated.
- [ ] UI primitive and design token foundations are implemented.
- [ ] CI passes (`lint`, `typecheck`, `test`) with Sprint 1 changes.
- [ ] No deferred systems implemented.
