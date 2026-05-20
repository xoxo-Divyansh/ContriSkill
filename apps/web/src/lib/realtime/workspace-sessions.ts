"use client";

import type {
  WorkspaceSessionLeftPayload,
  WorkspaceSessionLifecyclePayload,
  WorkspaceSessionParticipantPayload,
  WorkspaceSessionSnapshotPayload
} from "@contriskill/contracts";
import { useCallback, useMemo, useState } from "react";

import { useRealtimeEvent, useRealtimeSubscription } from "../../providers/realtime-provider";
import type { RealtimeUiEvent } from "../../providers/realtime-provider";

import { contributionWorkspaceSessionSubscription } from "./subscriptions";

export type WorkspaceSessionStoreState = {
  workspaceId: string | undefined;
  targetId: string | undefined;
  participants: WorkspaceSessionParticipantPayload[];
};

export const createWorkspaceSessionStore = (
  initialState: WorkspaceSessionStoreState = {
    workspaceId: undefined,
    targetId: undefined,
    participants: []
  }
) => {
  let state: WorkspaceSessionStoreState = {
    workspaceId: initialState.workspaceId,
    targetId: initialState.targetId,
    participants: [...initialState.participants]
  };

  const sortParticipants = (
    participants: WorkspaceSessionParticipantPayload[]
  ): WorkspaceSessionParticipantPayload[] => {
    return [...participants].sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
  };

  return {
    getState: (): WorkspaceSessionStoreState => {
      return {
        workspaceId: state.workspaceId,
        targetId: state.targetId,
        participants: [...state.participants]
      };
    },
    applySnapshot: (payload: WorkspaceSessionSnapshotPayload): WorkspaceSessionStoreState => {
      state = {
        workspaceId: payload.workspaceId,
        targetId: payload.targetId,
        participants: sortParticipants(payload.participants)
      };
      return state;
    },
    applyLifecycle: (payload: WorkspaceSessionLifecyclePayload): WorkspaceSessionStoreState => {
      const remaining = state.participants.filter(
        (entry) => entry.workspaceSessionId !== payload.session.workspaceSessionId
      );
      state = {
        workspaceId: payload.workspaceId,
        targetId: payload.targetId,
        participants: sortParticipants([...remaining, payload.session])
      };
      return state;
    },
    applyLeft: (payload: WorkspaceSessionLeftPayload): WorkspaceSessionStoreState => {
      state = {
        workspaceId: payload.workspaceId,
        targetId: payload.targetId,
        participants: state.participants.filter(
          (entry) => entry.workspaceSessionId !== payload.workspaceSessionId
        )
      };
      return state;
    }
  };
};

export type WorkspaceSessionState = {
  workspaceId: string | undefined;
  participants: WorkspaceSessionParticipantPayload[];
  activeCount: number;
};

export const useContributionWorkspaceSessions = (contributionId: string): WorkspaceSessionState => {
  const [participants, setParticipants] = useState<WorkspaceSessionParticipantPayload[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>();
  const store = useMemo(() => createWorkspaceSessionStore(), []);

  useRealtimeSubscription(contributionWorkspaceSessionSubscription(contributionId));

  useRealtimeEvent(
    useCallback(
      (event: RealtimeUiEvent) => {
        if (event.topicHint !== `contribution:${contributionId}`) {
          return;
        }

        if (event.eventName === "collaboration.workspace_session.snapshot.v1") {
          const payload = event.payload as WorkspaceSessionSnapshotPayload;
          const next = store.applySnapshot(payload);
          setWorkspaceId(next.workspaceId);
          setParticipants(next.participants);
          return;
        }

        if (
          event.eventName === "collaboration.workspace_session.joined.v1" ||
          event.eventName === "collaboration.workspace_session.updated.v1"
        ) {
          const payload = event.payload as WorkspaceSessionLifecyclePayload;
          const next = store.applyLifecycle(payload);
          setWorkspaceId(next.workspaceId);
          setParticipants(next.participants);
          return;
        }

        if (event.eventName === "collaboration.workspace_session.left.v1") {
          const payload = event.payload as WorkspaceSessionLeftPayload;
          const next = store.applyLeft(payload);
          setWorkspaceId(next.workspaceId);
          setParticipants(next.participants);
        }
      },
      [contributionId, store]
    )
  );

  return useMemo(
    () => ({
      workspaceId,
      participants,
      activeCount: participants.length
    }),
    [participants, workspaceId]
  );
};
