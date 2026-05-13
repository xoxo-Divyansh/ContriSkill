import type { HttpClient } from "./types";

export type PublicUserProfile = {
  id: string;
  username: string;
  headline?: string;
  skills?: string[];
  reputationScore?: number;
};

export type UpdateMyProfileInput = {
  headline?: string;
  bio?: string;
  skills?: string[];
};

export type UpdateMyProfileOutput = {
  profile: {
    id: string;
    username: string;
    headline?: string;
    bio?: string;
    skills?: string[];
  };
};

export type ReputationSnapshot = {
  score: number;
  completionRate: number;
  reviewQualityScore: number;
};

export type ReputationEvent = {
  eventType: string;
  delta: number;
  sourceType: string;
  sourceId: string;
};

export type MyReputationOutput = {
  snapshot: ReputationSnapshot;
  recentEvents: ReputationEvent[];
};

export type UserClient = {
  getPublicProfile(userId: string): Promise<PublicUserProfile>;
  updateMyProfile(input: UpdateMyProfileInput): Promise<UpdateMyProfileOutput>;
  getMyReputation(): Promise<MyReputationOutput>;
};

export const createUserClient = (httpClient: HttpClient): UserClient => {
  return {
    getPublicProfile: async (userId) =>
      httpClient.get<PublicUserProfile>(`/api/v1/users/${encodeURIComponent(userId)}`),
    updateMyProfile: async (input) =>
      httpClient.patch<UpdateMyProfileOutput, UpdateMyProfileInput>("/api/v1/users/me/profile", {
        body: input
      }),
    getMyReputation: async () => httpClient.get<MyReputationOutput>("/api/v1/users/me/reputation")
  };
};
