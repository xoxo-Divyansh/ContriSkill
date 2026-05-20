# Conflict Detection

## Objective

Define conflict categories and response behavior for collaborative mutations without introducing CRDT/OT complexity in MVP.

## Conflict Types (MVP)

1. `SAME_FIELD_CONFLICT`
2. `STALE_BASE`
3. `OWNERSHIP_FORBIDDEN`
4. `CAPABILITY_FORBIDDEN`
5. `INVALID_STATE`

## Same-Field Conflict

- Condition: two actors mutate same logical field against similar base snapshot and server cannot safely merge.
- Detection point: application service orchestration (after domain validation pre-commit).
- Response: `conflict` acknowledgement with changed field hints where safe.

## Stale-Base Conflict

- Condition: mutation `baseVersion` older than persisted entity version for mutation target.
- Detection point: repository/application service pre-write guard.
- Response: `conflict` acknowledgement with latest server version and optional state summary.

## Ownership/Capability Conflict

- Ownership conflict:
  - actor is authenticated but not allowed owner/collaborator for target action.
- Capability conflict:
  - actor role/capability does not permit mutation type.
- Detection point: authorization/capability layer before domain mutation execution.
- Response: deterministic `rejected` or `conflict` mapping (policy-defined).

## Invalid-State Conflict

- Condition: mutation requests transition/action not valid from current persisted state.
- Detection point: domain state machine/policy.
- Response: `conflict` with current state and allowed transitions summary.

## Conflict Response Model

```ts
type MutationConflictResponse = {
  mutationId: string;
  status: "conflict";
  conflictCode:
    | "SAME_FIELD_CONFLICT"
    | "STALE_BASE"
    | "OWNERSHIP_FORBIDDEN"
    | "CAPABILITY_FORBIDDEN"
    | "INVALID_STATE";
  serverVersion?: number;
  latestState?: string;
  changedFields?: string[];
  message: string;
};
```

## Operator Diagnostics Requirements

- Increment conflict counters per `conflictCode`.
- Log actor-safe conflict metadata (no sensitive content payloads).
- Track retry-after-conflict success rate as future quality metric.

## OPEN_DECISION

1. Should ownership/capability violations map to `rejected` always, or `conflict` for consistent client handling?
2. How much `changedFields` detail is safe to expose without leaking sensitive edit intent?
3. Do we need conflict prioritization rules when multiple conflict types are true?
