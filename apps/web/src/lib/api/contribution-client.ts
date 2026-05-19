import type {
  ContributionDifficulty,
  ContributionPostState,
  ContributionType
} from "@contriskill/domain";

import type { HttpClient } from "./types";

export type CreateContributionInput = {
  type: ContributionType;
  title: string;
  description: string;
  difficulty: ContributionDifficulty;
  creditOffer: number;
};

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
  state:
    | "pending"
    | "active"
    | "awaiting_verification"
    | "verified"
    | "disputed"
    | "failed"
    | "cancelled"
    | "under_moderation";
};

export type ContributionClient = {
  createPost(input: CreateContributionInput, accessToken?: string): Promise<ContributionPost>;
  submitApplication(
    input: { postId: string; message: string },
    accessToken?: string
  ): Promise<ContributionApplication>;
  acceptApplication(
    input: { postId: string; applicationId: string },
    accessToken?: string
  ): Promise<ContributionCollaboration>;
};

const sessionHeader = (accessToken: string): HeadersInit => {
  return { "x-session-token": accessToken };
};

export const createContributionClient = (httpClient: HttpClient): ContributionClient => {
  return {
    createPost: async (input, accessToken) => {
      const response = await httpClient.post<
        {
          post: ContributionPost;
        },
        CreateContributionInput
      >("/api/v1/posts", {
        body: input,
        ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
      });

      return response.post;
    },
    submitApplication: async (input, accessToken) => {
      const response = await httpClient.post<
        {
          application: ContributionApplication;
        },
        {
          message: string;
        }
      >(`/api/v1/posts/${input.postId}/applications`, {
        body: {
          message: input.message
        },
        ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
      });

      return response.application;
    },
    acceptApplication: async (input, accessToken) => {
      const response = await httpClient.post<{
        collaboration: ContributionCollaboration;
      }>(`/api/v1/posts/${input.postId}/applications/${input.applicationId}/accept`, {
        ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
      });

      return response.collaboration;
    }
  };
};
