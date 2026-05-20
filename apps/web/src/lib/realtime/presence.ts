"use client";

import { useCallback, useMemo, useState } from "react";

import { useRealtimeEvent, useRealtimeSubscription } from "../../providers/realtime-provider";
import type { RealtimeUiEvent } from "../../providers/realtime-provider";

import { contributionPresenceSubscription } from "./subscriptions";

type PresenceState = {
  activeUserIds: string[];
  activeCount: number;
};

export const useContributionPresence = (contributionId: string): PresenceState => {
  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);

  useRealtimeSubscription(contributionPresenceSubscription(contributionId));

  useRealtimeEvent(
    useCallback(
      (event: RealtimeUiEvent) => {
        if (event.topicHint !== `contribution:${contributionId}`) {
          return;
        }

        if (event.eventName === "contribution.presence.snapshot.v1") {
          const payload = event.payload as { postId?: string; activeUserIds?: string[] };
          if (payload.postId === contributionId && Array.isArray(payload.activeUserIds)) {
            setActiveUserIds(payload.activeUserIds);
          }
          return;
        }

        if (
          event.eventName === "contribution.presence.joined.v1" ||
          event.eventName === "contribution.presence.left.v1"
        ) {
          const payload = event.payload as { postId?: string; activeUserIds?: string[] };
          if (payload.postId === contributionId && Array.isArray(payload.activeUserIds)) {
            setActiveUserIds(payload.activeUserIds);
          }
        }
      },
      [contributionId]
    )
  );

  return useMemo(
    () => ({
      activeUserIds,
      activeCount: activeUserIds.length
    }),
    [activeUserIds]
  );
};
