export const contributionTypes = [
  "mentorship",
  "collaboration",
  "problem_solving",
  "educational",
  "community_safety"
] as const;

export type ContributionType = (typeof contributionTypes)[number];

export const contributionDifficulties = ["low", "medium", "high"] as const;

export type ContributionDifficulty = (typeof contributionDifficulties)[number];

export type ContributionPost = {
  id: string;
  creatorUserId: string;
  type: ContributionType;
  title: string;
  description: string;
  difficulty: ContributionDifficulty;
  creditOffer: number;
  state: ContributionPostState;
  createdAt: string;
};

export const contributionPostStates = [
  "open",
  "in_review",
  "accepted",
  "in_progress",
  "completed",
  "verified",
  "disputed",
  "cancelled",
  "expired"
] as const;

export type ContributionPostState = (typeof contributionPostStates)[number];

export const contributionCollaborationStates = [
  "pending",
  "active",
  "awaiting_verification",
  "verified",
  "disputed",
  "failed",
  "cancelled",
  "under_moderation"
] as const;

export type ContributionCollaborationState = (typeof contributionCollaborationStates)[number];

export type ContributionApplication = {
  id: string;
  postId: string;
  applicantUserId: string;
  message: string;
  createdAt: string;
};

export type ContributionCollaboration = {
  id: string;
  postId: string;
  requesterUserId: string;
  contributorUserId: string;
  state: ContributionCollaborationState;
  startedAt?: string;
  completedAt?: string;
};

export const contributionActorRoles = ["requester", "contributor", "moderator", "system"] as const;

export type ContributionActorRole = (typeof contributionActorRoles)[number];

export type ContributionActorContext = {
  actorUserId?: string;
  actorRole: ContributionActorRole;
};
