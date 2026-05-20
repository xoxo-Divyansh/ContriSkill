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

export type ContributionPostQueryInput = {
  limit: number;
  cursor?: {
    createdAt: string;
    id: string;
  };
  state?: ContributionPost["state"];
  type?: ContributionPost["type"];
  difficulty?: ContributionPost["difficulty"];
  sort?: "created_at_desc" | "created_at_asc";
};

export type ContributionPostQueryResult = {
  items: ContributionPost[];
  nextCursor?: {
    createdAt: string;
    id: string;
  };
};

export type ContributionRepository = {
  createPost(input: CreateContributionPostInput): Promise<ContributionPost>;
  listPosts(input: ContributionPostQueryInput): Promise<ContributionPostQueryResult>;
  getPostById(postId: string): Promise<ContributionPost | undefined>;
  updatePostDetails(
    postId: string,
    update: Partial<Pick<ContributionPost, "title" | "description" | "difficulty" | "creditOffer">>
  ): Promise<ContributionPost>;
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
