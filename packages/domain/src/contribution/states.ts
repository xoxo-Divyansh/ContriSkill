import type { ContributionCollaborationState, ContributionPostState } from "./types.js";

export const contributionPostTransitions: Record<
  ContributionPostState,
  readonly ContributionPostState[]
> = {
  open: ["in_review", "accepted", "cancelled", "expired"],
  in_review: ["accepted", "cancelled", "expired"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["verified", "disputed"],
  verified: [],
  disputed: ["in_progress", "cancelled"],
  cancelled: [],
  expired: []
};

export const contributionCollaborationTransitions: Record<
  ContributionCollaborationState,
  readonly ContributionCollaborationState[]
> = {
  pending: ["active", "cancelled"],
  active: ["awaiting_verification", "cancelled", "under_moderation"],
  awaiting_verification: ["verified", "disputed", "cancelled", "under_moderation"],
  verified: [],
  disputed: ["active", "failed", "under_moderation"],
  failed: [],
  cancelled: [],
  under_moderation: ["active", "verified", "failed", "cancelled"]
};
