import type { RealtimeSubscriptionTopic } from "@contriskill/contracts";

export const contributionListTopic = "contribution:list" as const;

export const contributionDetailTopic = (postId: string): `contribution:${string}` => {
  return `contribution:${postId}`;
};

export const isContributionTopic = (topic: RealtimeSubscriptionTopic): boolean => {
  return topic.startsWith("contribution:");
};
