# Sprint 1 Implementation Plan

- **Purpose:** Define the exact Sprint 1 execution plan for ContriSkill foundation and identity baseline, without implementing product domain features.
- **Owner:** Engineering + Architecture
- **Status:** Draft
- **Sprint Window:** 2 weeks
- **Related docs:** `mvp-implementation-blueprint.md`, `phase1-execution-plan.md`, `../02-architecture/api-spec.md`, `../04-design/wireframe-notes.md`

## 1. Sprint 1 Scope

Sprint 1 delivers only the implementation foundation required to start product work safely:

- auth foundation architecture
- provider and route group foundations
- environment validation foundations
- frontend/backend shared constant and contract structure
- API client architecture shell
- protected route strategy foundations
- session and role model base approach
- design system and UI primitive foundations

## 2. Explicit Out of Scope

- contribution engine behavior
- messaging behavior
- reputation behavior
- moderation workflows
- database schema implementation
- product screens beyond placeholder shells

## 3. Exact Implementation Order

## Step 0: Baseline Verification

1. confirm CI baseline is green on foundation branch
2. confirm lint/typecheck/test scripts execute from root
3. freeze Sprint 1 contract scope before branch fan-out

## Step 1: Shared Domain and Contract Constants

1. define canonical role constants (`public`, `user`, `participant`, `owner`, `moderator`, `admin`) in shared package
2. define canonical auth/session status constants in shared package
3. define API envelope/error code constants matching `api-spec.md`
4. export constants from shared package index boundaries

Dependency gate:

- No provider or route guard code before shared constants are available.

## Step 2: Environment Validation Layer

1. implement API environment validator module (required/optional keys, typed output)
2. implement web environment validator module (public env keys only)
3. add fail-fast bootstrap checks on missing critical keys
4. align key names with `.env.example` and `packages/config`

Dependency gate:

- No auth/session bootstrap before environment validation is wired.

## Step 3: Auth Foundation Architecture (No Business Logic)

1. define auth module boundaries in API:

- transport layer routes namespace (`/api/v1/auth/*`)
- application service interfaces
- placeholder adapter contracts

2. define session model types:

- access token metadata shape
- refresh session metadata shape
- auth actor context shape

3. define role-aware request context interfaces for API middleware chain
4. add non-feature health-safe placeholder route handlers that return contract-compliant not-implemented responses where needed

Dependency gate:

- No protected route guards before request actor context is standardized.

## Step 4: API Client Architecture (Web)

1. define a single API client core with:

- base URL resolution from validated env
- standard response/error envelope parsing
- request ID propagation strategy

2. define module-scoped client wrappers:

- `authClient`
- `userClient`

3. define typed error normalization for `401/403/409/422`
4. add no-feature mock-safe methods with typed contracts only

Dependency gate:

- No screen-level integration before API client error model exists.

## Step 5: Provider Hierarchy

1. define app root provider order for web:

- environment provider
- session provider
- API client provider
- query/cache provider (if enabled in foundation)
- theme/design-system provider

2. enforce provider contract boundaries:

- session provider does not fetch product data
- API client provider is transport-only
- design provider is presentation-only

3. wire providers in root layout with placeholder-safe defaults

Dependency gate:

- No protected route wrappers before session provider contract is stable.

## Step 6: Route Group Strategy

1. define Next.js route groups:

- `(public)` for landing and auth entry
- `(app)` for authenticated shell
- `(app)/(profile)` for profile baseline routes

2. create route-level guard policy map:

- public-only routes
- auth-required routes
- role-gated routes (future-ready)

3. define server/client guard interaction model

Dependency gate:

- No role-specific feature routing until role policy map is committed.

## Step 7: Protected Route Strategy

1. define guard primitives:

- `requireAuth`
- `requireRole`
- `redirectIfAuthenticated`

2. define unauthorized and forbidden fallback behavior
3. define session-expired handling path
4. align guard behavior with `api-spec` authorization model

Dependency gate:

- No product route implementation while guard behavior is unresolved.

## Step 8: Design System Foundation and UI Primitives

1. define design tokens foundation:

- spacing scale
- typography tokens
- color tokens
- radii/shadow tokens

2. define primitive component set (no product components):

- `Button`
- `Input`
- `Label`
- `Card`
- `Stack`
- `Container`
- `Text`

3. define primitive accessibility baseline:

- focus states
- keyboard navigation consistency
- semantic element mapping

4. document primitive usage boundaries:

- no domain behavior in primitives
- no API calls in UI package

Dependency gate:

- No feature UI composition until primitive contracts are stable.

## Step 9: Frontend/Backend Coordination Workflow (Sprint 1)

1. backend publishes auth/user API contract stubs
2. frontend validates client typing and provider integration against stubs
3. both pods agree on error and auth state mapping
4. integration smoke checks run on branch before merge

## 4. Auth Foundation Architecture

API module shape:

- `modules/auth/routes`
- `modules/auth/controllers`
- `modules/auth/services`
- `modules/auth/types`
- `modules/auth/policies`

Core interfaces for Sprint 1:

- `AuthTokens`
- `SessionContext`
- `AuthActor`
- `Role`
- `AuthPolicyDecision`

Policy baseline:

- request can be `anonymous` or `authenticated`
- role evaluation is deterministic and side-effect free
- policy checks are reusable across route handlers

## 5. Session and Role Model Approach

Session model (foundation only):

- `anonymous`
- `authenticated`
- `expired`

Role model (shared constants):

- `public`
- `user`
- `participant`
- `owner`
- `moderator`
- `admin`

Sprint 1 rule:

- only `public` and `user` enforcement is active
- advanced roles are defined and validated by type, but not functionally exercised

## 6. Provider Hierarchy (Target)

Recommended top-level order:

1. `EnvProvider`
2. `SessionProvider`
3. `ApiClientProvider`
4. `State/QueryProvider`
5. `DesignSystemProvider`

Rationale:

- env must initialize before API client
- session must initialize before route guards
- design should remain independent of auth/business state

## 7. Route Group Strategy

Route groups for Sprint 1:

- `src/app/(public)/*`
- `src/app/(auth)/*`
- `src/app/(app)/*`

Guard model:

- `(public)`: always accessible
- `(auth)`: blocked for authenticated users when appropriate
- `(app)`: requires authenticated session context

## 8. Environment Validation Flow

API startup flow:

1. load env
2. validate required keys
3. coerce typed values
4. fail fast on invalid/missing configuration
5. export immutable env object

Web startup flow:

1. read public env keys
2. validate required client-safe keys
3. expose typed env object to providers
4. fail fast in development for missing keys

## 9. Shared Frontend/Backend Constants Structure

Target shared package locations:

- `packages/domain/src/constants/roles.ts`
- `packages/domain/src/constants/session.ts`
- `packages/contracts/src/constants/api-errors.ts`
- `packages/contracts/src/constants/http.ts`

Rules:

- all role and session labels originate from shared constants
- no duplicated literal role strings in app code
- API error code usage must map to contract constants

## 10. API Client Architecture

Client layers:

1. transport core (`fetch` wrapper, headers, timeout)
2. envelope parser (success/error normalization)
3. domain clients (`authClient`, `userClient`)

Requirements:

- typed request/response contracts from shared package
- normalized error object with code and details
- request-id extraction support for debugging
- no feature-specific business transformation logic

## 11. UI Primitive Foundation Structure

Target package structure:

- `packages/ui/src/tokens/*`
- `packages/ui/src/primitives/*`
- `packages/ui/src/providers/*`
- `packages/ui/src/index.ts`

Primitive standards:

- controlled/uncontrolled pattern support where applicable
- minimal variants
- accessibility-first defaults
- no domain coupling

## 12. Risk Areas and Mitigation

### Risk: Role Strings Drift Across Apps

- Mitigation: enforce shared constant imports and lint rule checks.

### Risk: Session Guard Inconsistency Between Server and Client

- Mitigation: single guard policy contract and shared test cases.

### Risk: Env Misconfiguration Breaks Startup

- Mitigation: fail-fast validators with clear error messaging.

### Risk: API Error Handling Diverges by Module

- Mitigation: central error normalization in API client core.

## 13. Sprint 1 Done Criteria

Sprint 1 is done only when all are true:

1. shared role/session/api-error constants are implemented and consumed by both apps
2. environment validators exist for web and API with fail-fast behavior
3. auth/session foundation module contracts exist without business feature implementation
4. provider hierarchy is wired and documented in web app root
5. route group and protected route strategy is implemented with guard policy map
6. API client core and auth/user client shells are typed and integrated
7. UI primitive foundation and design token scaffolding are implemented
8. CI passes (lint, typecheck, tests) with new Sprint 1 foundation changes
9. no contribution engine, messaging, reputation, or DB schema implementation is added

## 14. OPEN DECISION

- Should Sprint 1 include optional OAuth wiring stubs, or defer entirely to Sprint 2?
- Should session storage strategy be cookie-first only in Sprint 1, or support pluggable strategy abstraction now?
- Should route guard checks run server-only, or dual server/client in Sprint 1 for UX smoothness?
- Should API client include retry behavior in Sprint 1, or defer retries until integration hardening?
- What minimum primitive set is mandatory before Sprint 2 feature UI work can begin?
