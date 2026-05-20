# Mutation Contracts

## Objective

Define canonical mutation request/acknowledgement contracts for collaborative updates without introducing runtime-specific coupling.

## Canonical Mutation Envelope

```ts
type CollaborativeMutationEnvelope<TPayload> = {
  mutationId: string;
  clientId: string;
  actorId: string;
  target: {
    entityType: "contribution.post" | "contribution.application";
    entityId: string;
  };
  mutationType: string;
  payload: TPayload;
  occurredAt: string;
  baseVersion?: number;
  expectedState?: string;
};
```

## Field Definitions

- `mutationId`: globally unique id for idempotency and reconciliation.
- `clientId`: stable per-client runtime identity for replay/dup diagnostics.
- `actorId`: authenticated actor initiating mutation (never anonymous for collaborative mutation path).
- `target`: entity type/id being mutated.
- `mutationType`: versioned action identifier (example: `contribution.post.update.v1`).
- `payload`: typed mutation input, aligned to existing domain/application contracts.
- `occurredAt`: client event timestamp (ISO), used for diagnostics only.
- `baseVersion`: client’s last known entity version, used for stale-base detection.
- `expectedState`: optional optimistic state precondition.

## Acknowledgement Contract

```ts
type MutationAcknowledgement = {
  mutationId: string;
  status: "accepted" | "rejected" | "conflict";
  acknowledgedAt: string;
  resultVersion?: number;
  conflictCode?:
    | "STALE_BASE"
    | "SAME_FIELD_CONFLICT"
    | "INVALID_STATE"
    | "CAPABILITY_FORBIDDEN"
    | "OWNERSHIP_FORBIDDEN";
  conflictDetails?: {
    message: string;
    serverVersion?: number;
    latestState?: string;
    changedFields?: string[];
  };
};
```

## Mutation Type Direction (MVP)

- `contribution.post.create.v1` (mostly non-conflicting create path).
- `contribution.post.update.v1`.
- `contribution.post.archive.v1`.
- `contribution.application.submit.v1`.
- `contribution.application.withdraw.v1`.

## Idempotency Rules

- Backend must treat `mutationId + actorId` as idempotency key.
- Duplicate accepted mutation returns deterministic acknowledgement with original result metadata.
- Duplicate rejected/conflict mutation returns deterministic failure contract where safe.

## Contract Boundaries

- Mutation envelope is transport-agnostic (HTTP, websocket command channel, or hybrid).
- Payload schema validation must happen before domain execution.
- Unknown mutation type is rejected at intake boundary.

## OPEN_DECISION

1. Do we include `requestId`/trace id directly in mutation envelope or derive at intake layer?
2. Should `baseVersion` be mandatory for all updates in MVP or only mutable-state transitions?
3. Should `expectedState` remain optional guard or become required for state transitions?
