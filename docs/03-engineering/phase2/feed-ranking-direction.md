# Feed + Ranking Direction

## Objective

Define safe discovery evolution from deterministic feed ordering to trust-aware ranking without introducing opaque trust manipulation risk.

## Ranking Boundaries

- Keep ranking as independent layer after candidate retrieval.
- Retrieval decides eligibility; ranking decides ordering.
- Trust-critical penalties are not hidden inside ranking logic.

## MVP Feed Direction

- Deterministic order:
  - recent first within allowed visibility/policy constraints.
- Filter out inactive/locked/moderation-hidden content as policy requires.

## Future Recommendation Considerations

- Candidate scoring signals (future):
  - freshness
  - relevance by contribution type/difficulty
  - requester/contributor trust compatibility
  - engagement quality signals (not raw volume only)

## Anti-Spam / Quality Direction

- Downrank suspicious low-quality bursts.
- Cap repeated low-value exposure from same actor/window.
- Use moderation/abuse flags as safety signals with policy controls.

## Trending vs Discovery Separation

- Trending:
  - short-window velocity emphasis.
- Discovery:
  - personalized or category-driven relevance.
- Keep both surfaces separate to avoid metric conflict and feed instability.

## Fairness and Transparency Principles

- Keep coarse ranking rationale explainable internally.
- Avoid black-box user trust penalties without auditable policy event.
- Ensure new contributors still receive baseline exposure opportunity.

## MVP vs Evolution

### MVP/near-term

- deterministic feed + guarded filters.
- basic anti-spam constraints.

### Deferred

- personalized ranking.
- exploration/exploitation tuning.
- learning-to-rank systems.

## OPEN_DECISION

1. Should trust score influence ordering in MVP or only eligibility filters.
2. What minimum exposure floor protects new contributors.
3. How moderation suspicion affects ranking vs hard visibility suppression.
