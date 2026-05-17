# Query/Search Architecture

## Objective

Define contribution retrieval and discovery query architecture that scales from MVP feed reads to future ranking/search systems.

## Query Boundaries

- Query/read layer remains separate from command/state-transition services.
- API reads should use dedicated query adapters for:
  - post list/feed
  - post detail
  - application list by post
  - collaboration list by actor

## Contribution Retrieval Strategy

- Start with relational queries over normalized write schema.
- Add read-focused query projections only when latency or complexity requires it.
- Avoid premature CQRS split into separate services.

## Filtering/Search Boundaries

### MVP Filters

- post state
- contribution type
- difficulty
- credit range
- createdAt recency

### Deferred Full Search

- semantic/keyword relevance
- typo tolerance
- cross-entity search (users + contributions + collaborations)

## Feed Query Strategy

- Use deterministic ordering for baseline feed:
  - `created_at DESC`, with tie-breaker by `id`.
- Exclude hard-locked/removed moderated resources from default feed view.
- Keep pagination key stable across updates.

## Pagination Direction

- Prefer cursor pagination for feed and high-volume lists.
- Keep page-number pagination only for low-volume admin screens if needed.
- Cursor shape recommendation:
  - `{createdAt, id}` for contribution feed

## Indexing Direction

- Core indexes:
  - posts `(state, created_at desc, id)`
  - posts `(type, state, created_at desc)`
  - applications `(post_id, created_at)`
  - collaborations `(requester_user_id, state)` and `(contributor_user_id, state)`
- Add partial indexes for active states if query profile confirms benefit.

## Ranking/Search Separation (Future)

- Keep ranking as separate layer from storage query layer.
- Base query returns candidate set.
- Ranking layer scores/reorders candidates by policy.
- Search service extraction is optional and only after clear performance/product trigger.

## MVP vs Evolution

### MVP/near-term

- DB-backed filtered retrieval.
- Cursor pagination for feed.
- Index-first performance tuning.

### Deferred

- External search engine.
- ML ranking pipeline.
- Personalized recommendation graph.

## OPEN_DECISION

1. Maximum feed window size per query.
2. Whether reputation/trust score affects default feed ordering in MVP.
3. Whether to maintain denormalized read table for feed before Sprint 3.
