# Scaling Boundaries

## Objective

Define how ContriSkill scales from current modular monolith foundation to future distributed architecture only when justified by product and operational pressure.

## Monolith-First Position

- Keep command/query/event orchestration in modular monolith for near term.
- Preserve explicit module boundaries to enable future extraction.
- Avoid premature service sprawl.

## Future Extraction Points

Potential extraction candidates (only when needed):

1. Notification delivery worker/service.
2. Realtime gateway service.
3. Search/ranking service.
4. Moderation operations service.

## Extraction Triggers

- sustained p95 latency regression from mixed workloads.
- deployment coupling causing frequent cross-domain regressions.
- scaling needs diverge materially between modules.
- operational ownership requires independent release cadence.

## Queue/Event-Bus Boundaries

- Start with internal outbox + worker model.
- Introduce external queue/event bus when:
  - event volume outgrows single process reliability,
  - fan-out consumers grow materially,
  - retry/dead-letter operations need independent scaling.

## Infrastructure Evolution Direction

### Phase A (Current/near-term)

- single API deployment
- relational DB
- async worker in same deploy unit or companion process

### Phase B

- separate worker runtime
- managed queue/event transport
- stronger observability + scaling policies

### Phase C

- selective service extraction with contract-hardened boundaries
- independent deploy pipelines for extracted domains

## Data Ownership Boundaries

- Each extracted domain must own its write model.
- Cross-domain communication via integration events and stable APIs.
- Avoid shared writable tables across extracted services.

## MVP vs Evolution

### MVP/near-term

- modular monolith + clear interfaces + event outbox pattern.

### Deferred

- broad microservice decomposition.
- multi-region active-active complexity.

## OPEN_DECISION

1. Concrete scale thresholds that trigger each extraction.
2. Whether moderation should remain embedded longer than notification/realtime.
3. When to adopt external queue relative to notification/event volume growth.
