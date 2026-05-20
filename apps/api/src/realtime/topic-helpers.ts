import type { RealtimeSubscriptionTopic } from "@contriskill/contracts";

export const contributionListTopic = "contribution:list" as const;

export const contributionDetailTopic = (postId: string): `contribution:${string}` => {
  return `contribution:${postId}`;
};

export const isContributionTopic = (topic: RealtimeSubscriptionTopic): boolean => {
  return topic.startsWith("contribution:");
};

export const extractContributionRoomId = (topic: RealtimeSubscriptionTopic): string | undefined => {
  if (!topic.startsWith("contribution:")) {
    return undefined;
  }

  const roomId = topic.slice("contribution:".length);
  if (!roomId || roomId === "list") {
    return undefined;
  }

  return roomId;
};
