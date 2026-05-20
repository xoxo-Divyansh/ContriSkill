# Backend Mutation Flow

## Objective

Define backend mutation intake and orchestration boundaries that integrate with current auth, capability, domain, application service, and realtime event emission layers.

## Mutation Intake Boundary

- Primary intake path (MVP): HTTP API mutation endpoints.
- Optional future intake path: authenticated websocket command channel (deferred).
- Intake layer responsibilities:
  - schema validation
  - mutation envelope normalization
  - request actor association
  - idempotency key extraction

## Validation Stages

1. Envelope validation:
   - required fields
   - mutation type allowed
   - payload shape compatibility
2. Actor/session validation:
   - authenticated session required
   - active/non-revoked session
3. Capability validation:
   - role/capability check for mutation type and target scope
4. Domain precondition validation:
   - baseVersion/expectedState guards

## Authorization

- Capability checks occur before domain execution.
- Ownership checks occur in policy/domain boundary where contextual entity data exists.
- Unauthorized mutation attempts are observable and non-fatal to runtime.

## Domain/Service Execution

- Controllers remain thin.
- Application service orchestrates:
  - loading target aggregate
  - applying domain mutation
  - persistence call(s)
  - event append
- Domain enforces state transition and policy rules.

## Event Emission Rule

- Emit realtime mutation result events only after successful service operation commit.
- Rejected/conflict mutation outcomes emit acknowledgement response, not authoritative state-change event.

## Hard Boundary

- No direct DB writes from websocket transport handlers.
- No business rules in transport layer.
- No bypass of application service orchestration for collaborative mutation path.

## Error/Conflict Mapping

- Intake errors -> validation rejection contract.
- Policy/authorization failures -> rejected/conflict mapped response (policy-defined).
- Domain state failures -> conflict response with code.
- Infrastructure failures -> retryable error contract (without leaking internals).

## OPEN_DECISION

1. Should idempotency storage be in dedicated mutation log table or embedded in domain event/audit persistence?
2. Should acknowledgement payload include mutation processing latency for diagnostics?
3. Do we require per-mutation transaction envelope abstraction in MVP or reuse current service-level transaction semantics?
