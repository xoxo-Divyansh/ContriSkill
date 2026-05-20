import {
  realtimeEventNames,
  realtimeEventVersion,
  type ContributionRealtimePayload,
  type RealtimeEventEnvelope,
  type RealtimeScope,
  type RealtimeSubscriptionTopic
} from "@contriskill/contracts";

import { log } from "../observability/logger";

import { contributionDetailTopic, contributionListTopic } from "./topic-helpers";

export type RealtimeBroadcaster = {
  broadcastContributionCreated: (payload: ContributionRealtimePayload) => void;
  broadcastContributionUpdated: (payload: ContributionRealtimePayload) => void;
  broadcastContributionStateChanged: (payload: ContributionRealtimePayload) => void;
  broadcast: (topic: RealtimeSubscriptionTopic, envelope: RealtimeEventEnvelope<unknown>) => void;
};

const noop = (): void => {
  return;
};

let activeBroadcaster: RealtimeBroadcaster = {
  broadcastContributionCreated: noop,
  broadcastContributionUpdated: noop,
  broadcastContributionStateChanged: noop,
  broadcast: noop
};

export const setRealtimeBroadcaster = (broadcaster: RealtimeBroadcaster): void => {
  activeBroadcaster = broadcaster;
};

export const getRealtimeBroadcaster = (): RealtimeBroadcaster => {
  return activeBroadcaster;
};

const createEnvelope = (
  eventName:
    | typeof realtimeEventNames.contributionCreated
    | typeof realtimeEventNames.contributionUpdated
    | typeof realtimeEventNames.contributionStateChanged,
  scope: RealtimeScope,
  payload: ContributionRealtimePayload
): RealtimeEventEnvelope<ContributionRealtimePayload> => {
  return {
    eventId: `rte_${Math.random().toString(16).slice(2)}`,
    eventName,
    version: realtimeEventVersion,
    occurredAt: new Date().toISOString(),
    scope,
    payload
  };
};

export const createContributionBroadcaster = (): {
  publishCreated: (payload: ContributionRealtimePayload) => void;
  publishUpdated: (payload: ContributionRealtimePayload) => void;
  publishStateChanged: (payload: ContributionRealtimePayload) => void;
} => {
  return {
    publishCreated: (payload) => {
      try {
        const scope = { type: "contribution", id: payload.postId } as const;
        const envelope = createEnvelope(realtimeEventNames.contributionCreated, scope, payload);
        activeBroadcaster.broadcast(contributionListTopic, envelope);
        activeBroadcaster.broadcast(contributionDetailTopic(payload.postId), envelope);
      } catch (error) {
        log("warn", "Failed to broadcast contribution.created realtime event.", {
          postId: payload.postId,
          message: error instanceof Error ? error.message : "unknown"
        });
      }
    },
    publishUpdated: (payload) => {
      try {
        const scope = { type: "contribution", id: payload.postId } as const;
        const envelope = createEnvelope(realtimeEventNames.contributionUpdated, scope, payload);
        activeBroadcaster.broadcast(contributionListTopic, envelope);
        activeBroadcaster.broadcast(contributionDetailTopic(payload.postId), envelope);
      } catch (error) {
        log("warn", "Failed to broadcast contribution.updated realtime event.", {
          postId: payload.postId,
          message: error instanceof Error ? error.message : "unknown"
        });
      }
    },
    publishStateChanged: (payload) => {
      try {
        const scope = { type: "contribution", id: payload.postId } as const;
        const envelope = createEnvelope(
          realtimeEventNames.contributionStateChanged,
          scope,
          payload
        );
        activeBroadcaster.broadcast(contributionListTopic, envelope);
        activeBroadcaster.broadcast(contributionDetailTopic(payload.postId), envelope);
      } catch (error) {
        log("warn", "Failed to broadcast contribution.state_changed realtime event.", {
          postId: payload.postId,
          message: error instanceof Error ? error.message : "unknown"
        });
      }
    }
  };
};
