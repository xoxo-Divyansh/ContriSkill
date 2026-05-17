import { ContributionDomainError } from "./errors.js";
import type {
  ContributionActorContext,
  ContributionApplication,
  ContributionCollaboration,
  ContributionPost
} from "./types.js";

const isPositiveCreditOffer = (creditOffer: number): boolean => {
  return Number.isFinite(creditOffer) && creditOffer > 0;
};

export const assertValidPostCreation = (input: {
  creatorUserId: string;
  title: string;
  description: string;
  creditOffer: number;
}): void => {
  if (!input.creatorUserId.trim()) {
    throw new ContributionDomainError(
      "CONTRIBUTION_POLICY_VIOLATION",
      "Post creator user id is required."
    );
  }

  if (!input.title.trim() || !input.description.trim()) {
    throw new ContributionDomainError(
      "CONTRIBUTION_POLICY_VIOLATION",
      "Post title and description are required."
    );
  }

  if (!isPositiveCreditOffer(input.creditOffer)) {
    throw new ContributionDomainError(
      "CONTRIBUTION_POLICY_VIOLATION",
      "Credit offer must be greater than zero."
    );
  }
};

export const assertCanSubmitApplication = (
  post: ContributionPost,
  applicantUserId: string
): void => {
  if (post.state !== "open" && post.state !== "in_review") {
    throw new ContributionDomainError(
      "CONTRIBUTION_POLICY_VIOLATION",
      "Applications can only be submitted on open or in-review posts.",
      { currentState: post.state }
    );
  }

  if (post.creatorUserId === applicantUserId) {
    throw new ContributionDomainError(
      "CONTRIBUTION_POLICY_VIOLATION",
      "Post creator cannot apply to own post."
    );
  }
};

export const assertCanAcceptApplication = (
  actor: ContributionActorContext,
  post: ContributionPost,
  application: ContributionApplication
): void => {
  if (actor.actorRole !== "requester" || actor.actorUserId !== post.creatorUserId) {
    throw new ContributionDomainError(
      "CONTRIBUTION_FORBIDDEN",
      "Only post requester can accept applications."
    );
  }

  if (post.id !== application.postId) {
    throw new ContributionDomainError(
      "CONTRIBUTION_CONFLICT",
      "Application does not belong to target post."
    );
  }
};

export const assertCanSubmitVerification = (
  actor: ContributionActorContext,
  collaboration: ContributionCollaboration
): void => {
  const isParticipant =
    actor.actorUserId === collaboration.requesterUserId ||
    actor.actorUserId === collaboration.contributorUserId;
  if (!isParticipant) {
    throw new ContributionDomainError(
      "CONTRIBUTION_FORBIDDEN",
      "Only collaboration participants can submit verification."
    );
  }

  if (collaboration.state !== "awaiting_verification") {
    throw new ContributionDomainError(
      "CONTRIBUTION_POLICY_VIOLATION",
      "Verification requires collaboration to be in awaiting_verification state.",
      { currentState: collaboration.state }
    );
  }
};
