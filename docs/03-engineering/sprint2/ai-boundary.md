# AI Boundary (Sprint 2 Planning)

## Purpose

Define safe AI usage boundaries while trust/reputation systems are still maturing.

## AI Allowed (Future-Scoped, Not Yet Implemented)

- Draft assistance for profile/post writing suggestions.
- Content quality hints (clarity/completeness checks).
- Moderator assistant summaries (human decision retained).
- Operational analytics summaries for internal teams.

## AI Not Allowed Yet

- Final verification decisions.
- Final moderation decisions.
- Autonomous reputation or credit adjustments.
- Automated punitive actions without human approval.

## Safety Boundaries

- AI outputs are advisory, never authoritative for trust settlement.
- Any AI-assisted moderation view must preserve human accountability.
- High-risk actions require explicit human confirmation and audit capture.

## Trust/Reputation Risk Boundaries

- Avoid model-driven bias in contributor evaluation.
- Never use opaque scoring as sole action trigger in MVP.
- Keep reputation-impact logic deterministic and policy-driven.

## Human Review Requirements

- Human-in-the-loop required for:
  - verification approval/rejection,
  - moderation case resolution,
  - trust penalty application.
- AI recommendations must include confidence and source rationale where feasible.

## Future AI Helper Use Cases

- Duplicate report clustering.
- Dispute evidence summarization.
- Policy consistency checks for moderator actions.

## OPEN DECISION

- Minimum explainability threshold required for AI-assisted moderation tools.
- Data retention policy for prompts/responses with sensitive user evidence.
- Whether AI suggestions are visible to affected users in MVP+1.
