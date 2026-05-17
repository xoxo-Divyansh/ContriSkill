import type { ContributionDomainEvent } from "./events.js";
import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionPost
} from "./types.js";

export type CreateContributionPostInput = {
  creatorUserId: string;
  type: ContributionPost["type"];
  title: string;
  description: string;
  difficulty: ContributionPost["difficulty"];
  creditOffer: number;
};

export type ContributionRepository = {
  createPost(input: CreateContributionPostInput): Promise<ContributionPost>;
  getPostById(postId: string): Promise<ContributionPost | undefined>;
  updatePostState(postId: string, state: ContributionPost["state"]): Promise<ContributionPost>;

  createApplication(input: {
    postId: string;
    applicantUserId: string;
    message: string;
  }): Promise<ContributionApplication>;
  listApplicationsByPost(postId: string): Promise<ContributionApplication[]>;

  createCollaboration(input: {
    postId: string;
    requesterUserId: string;
    contributorUserId: string;
  }): Promise<ContributionCollaboration>;
  getCollaborationById(collaborationId: string): Promise<ContributionCollaboration | undefined>;
  updateCollaborationState(
    collaborationId: string,
    state: ContributionCollaboration["state"]
  ): Promise<ContributionCollaboration>;
};

export type ContributionEventRepository = {
  appendEvent(event: ContributionDomainEvent): Promise<void>;
  listEventsByAggregate(input: {
    aggregateType: ContributionDomainEvent["aggregateType"];
    aggregateId: string;
  }): Promise<ContributionDomainEvent[]>;
};
