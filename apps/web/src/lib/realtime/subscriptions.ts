import type { RealtimeSubscription } from "@contriskill/contracts";

export const actorSystemSubscription = (actorUserId: string): RealtimeSubscription => {
  return {
    scope: { type: "actor", id: actorUserId },
    topic: "system.actor"
  };
};

export const contributionListSubscription = (): RealtimeSubscription => {
  return {
    scope: { type: "contribution", id: "list" },
    topic: "contribution:list"
  };
};

export const contributionDetailSubscription = (contributionId: string): RealtimeSubscription => {
  return {
    scope: { type: "contribution", id: contributionId },
    topic: `contribution:${contributionId}`
  };
};
