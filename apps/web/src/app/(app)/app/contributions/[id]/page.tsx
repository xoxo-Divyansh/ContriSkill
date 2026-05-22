"use client";

import { Button, Input, Label, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  EmptyState,
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../../../../../components/workspace/workspace-foundation";
import styles from "../../../../../components/workspace/workspace-foundation.module.css";
import type { ContributionPost } from "../../../../../lib/api/contribution-client";
import { ApiClientError } from "../../../../../lib/api/types";
import { createDraftSyncStore } from "../../../../../lib/drafts";
import { createProjectionSyncStore } from "../../../../../lib/projections";
import { useContributionPresence } from "../../../../../lib/realtime/presence";
import {
  contributionDetailSubscription,
  contributionDraftSubscription,
  contributionProjectionSubscription
} from "../../../../../lib/realtime/subscriptions";
import { useContributionWorkspaceSessions } from "../../../../../lib/realtime/workspace-sessions";
import {
  formatSyncSummary,
  getRealtimeLabel,
  getSyncSurfaceLabel,
  resolveRealtimeTone
} from "../../../../../lib/ui/workspace-status";
import { useApiClient } from "../../../../../providers/api-client-provider";
import {
  useRealtime,
  useRealtimeEvent,
  useRealtimeSubscription,
  type RealtimeUiEvent
} from "../../../../../providers/realtime-provider";
import { useSession } from "../../../../../providers/session-provider";
import { AppShell } from "../../_components/app-shell";

type ContributionDetailPageProps = {
  params: {
    id: string;
  };
};

const normalizeApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
};

const formatContributionLabel = (value: string) => {
  return value
    .split("_")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
};

const resolveSyncTone = (isSyncing: boolean, error?: string, status?: string) => {
  if (error) {
    return "danger" as const;
  }

  if (isSyncing) {
    return "warning" as const;
  }

  if (status) {
    return "success" as const;
  }

  return "default" as const;
};

export default function ContributionDetailPage({ params }: ContributionDetailPageProps) {
  const { contributionClient, draftClient, projectionClient } = useApiClient();
  const { session, isReady } = useSession();
  const realtime = useRealtime();
  const presence = useContributionPresence(params.id);
  const workspaceSessions = useContributionWorkspaceSessions(params.id);
  const draftStore = useMemo(() => createDraftSyncStore(), []);
  const projectionStore = useMemo(() => createProjectionSyncStore(), []);
  const draftId = useMemo(() => `draft:contribution:${params.id}`, [params.id]);
  const projectionId = useMemo(() => `projection:contribution:${params.id}`, [params.id]);

  const [post, setPost] = useState<ContributionPost | undefined>();
  const [message, setMessage] = useState("I can help with this contribution.");
  const [applicationId, setApplicationId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [draftSyncStatus, setDraftSyncStatus] = useState<string | undefined>();
  const [draftSyncError, setDraftSyncError] = useState<string | undefined>();
  const [isDraftSyncing, setIsDraftSyncing] = useState(false);
  const [draftVersionLabel, setDraftVersionLabel] = useState("v0");
  const [projectionNote, setProjectionNote] = useState("");
  const [projectionSyncStatus, setProjectionSyncStatus] = useState<string | undefined>();
  const [projectionSyncError, setProjectionSyncError] = useState<string | undefined>();
  const [isProjectionSyncing, setIsProjectionSyncing] = useState(false);
  const [projectionVersionLabel, setProjectionVersionLabel] = useState("v0");
  const [draftPendingCount, setDraftPendingCount] = useState(0);
  const [projectionPendingCount, setProjectionPendingCount] = useState(0);

  const loadContributionDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const loaded = await contributionClient.getPostById(params.id, session.accessToken);
      setPost(loaded);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to load contribution detail."));
    } finally {
      setIsLoading(false);
    }
  }, [contributionClient, params.id, session.accessToken]);

  const loadDraftSnapshot = useCallback(async () => {
    setDraftSyncError(undefined);

    try {
      const snapshot = await draftClient.getSnapshot(draftId, session.accessToken);
      draftStore.hydrateRemoteSnapshot(snapshot);
      setDraftNote(snapshot.fields.note ?? "");
      setDraftVersionLabel(`v${snapshot.draftVersion}`);
      setDraftSyncStatus("Draft snapshot synchronized.");
    } catch (error) {
      const resolvedError = error as ApiClientError;

      if (resolvedError?.status === 404) {
        setDraftSyncStatus("No shared draft snapshot yet.");
        return;
      }

      setDraftSyncError(normalizeApiErrorMessage(error, "Failed to load draft snapshot."));
    }
  }, [draftClient, draftId, draftStore, session.accessToken]);

  const loadProjectionSnapshot = useCallback(async () => {
    setProjectionSyncError(undefined);

    try {
      const snapshot = await projectionClient.getSnapshot(projectionId, session.accessToken);
      projectionStore.hydrateRemoteSnapshot(snapshot);
      setProjectionNote(snapshot.fields.note ?? "");
      setProjectionVersionLabel(`v${snapshot.projectionVersion}`);
      setProjectionSyncStatus("Projection snapshot synchronized.");
    } catch (error) {
      const resolvedError = error as ApiClientError;

      if (resolvedError?.status === 404) {
        setProjectionSyncStatus("No shared workspace projection yet.");
        return;
      }

      setProjectionSyncError(
        normalizeApiErrorMessage(error, "Failed to load projection snapshot.")
      );
    }
  }, [projectionClient, projectionId, projectionStore, session.accessToken]);

  const refreshSyncCounters = useCallback(() => {
    const draftPending = draftStore
      .getState()
      .pendingPatches.filter((entry) =>
        ["pending", "optimistic_applied", "retrying"].includes(entry.status)
      ).length;
    const projectionPending = projectionStore
      .getState()
      .pendingUpdates.filter((entry) =>
        ["pending", "optimistic_applied", "retrying"].includes(entry.status)
      ).length;

    setDraftPendingCount(draftPending);
    setProjectionPendingCount(projectionPending);
  }, [draftStore, projectionStore]);

  useRealtimeSubscription(contributionDetailSubscription(params.id));
  useRealtimeSubscription(contributionDraftSubscription(params.id));
  useRealtimeSubscription(contributionProjectionSubscription(params.id));
  useRealtimeEvent(
    useCallback(
      (event: RealtimeUiEvent) => {
        if (event.topicHint !== `contribution:${params.id}`) {
          return;
        }

        if (
          event.eventName !== "contribution.post.created.v1" &&
          event.eventName !== "contribution.post.updated.v1" &&
          event.eventName !== "contribution.post.state_changed.v1"
        ) {
          if (
            event.eventName === "collaboration.draft.snapshot.v1" ||
            event.eventName === "collaboration.draft.patched.v1"
          ) {
            void loadDraftSnapshot();
            return;
          }

          if (
            event.eventName === "collaboration.draft.acknowledged.v1" ||
            event.eventName === "collaboration.draft.rejected.v1" ||
            event.eventName === "collaboration.draft.conflict.v1"
          ) {
            const payload = event.payload as {
              patchId: string;
              draftId: string;
              targetType: string;
              targetId: string;
              status: "acknowledged" | "rejected" | "conflict";
              appliedDraftVersion?: number;
              message?: string;
            };

            draftStore.applyRealtimeLifecycle(payload);
            const state = draftStore.getState();
            if (state.remoteDraft) {
              setDraftVersionLabel(`v${state.remoteDraft.draftVersion}`);
            }
            setDraftSyncStatus(`Draft lifecycle event processed: ${payload.status}.`);
            refreshSyncCounters();
          }

          if (
            event.eventName === "collaboration.projection.snapshot.v1" ||
            event.eventName === "collaboration.projection.updated.v1"
          ) {
            void loadProjectionSnapshot();
            return;
          }

          if (
            event.eventName === "collaboration.projection.acknowledged.v1" ||
            event.eventName === "collaboration.projection.rejected.v1" ||
            event.eventName === "collaboration.projection.conflict.v1"
          ) {
            const payload = event.payload as {
              updateId: string;
              projectionId: string;
              workspaceId: string;
              targetType: string;
              targetId: string;
              status: "acknowledged" | "rejected" | "conflict";
              appliedProjectionVersion?: number;
              message?: string;
            };

            projectionStore.applyRealtimeLifecycle(payload);
            const state = projectionStore.getState();
            if (state.remoteProjection) {
              setProjectionVersionLabel(`v${state.remoteProjection.projectionVersion}`);
            }
            setProjectionSyncStatus(`Projection lifecycle event processed: ${payload.status}.`);
            refreshSyncCounters();
          }

          return;
        }

        void loadContributionDetail();
      },
      [
        draftStore,
        loadContributionDetail,
        loadDraftSnapshot,
        loadProjectionSnapshot,
        params.id,
        projectionStore,
        refreshSyncCounters
      ]
    )
  );

  useEffect(() => {
    void loadContributionDetail();
    void loadDraftSnapshot();
    void loadProjectionSnapshot();
    refreshSyncCounters();
  }, [loadContributionDetail, loadDraftSnapshot, loadProjectionSnapshot, refreshSyncCounters]);

  const onSyncDraft = async () => {
    if (!session.userId) {
      setDraftSyncError("A signed-in workspace actor is required before syncing a draft.");
      return;
    }

    setIsDraftSyncing(true);
    setDraftSyncError(undefined);
    setDraftSyncStatus(undefined);

    const remoteDraft = draftStore.getState().remoteDraft;
    const nextEnvelope = {
      version: 1 as const,
      patchId: `dpt_${Math.random().toString(16).slice(2)}`,
      draftId,
      targetType: "contribution.post" as const,
      targetId: params.id,
      actorId: session.userId,
      clientId: "web-client",
      draftVersion: remoteDraft?.draftVersion ?? 0,
      baseVersion: remoteDraft?.draftVersion ?? 0,
      patch: {
        note: draftNote
      },
      timestamp: new Date().toISOString()
    };

    draftStore.enqueueOptimisticPatch(nextEnvelope);
    refreshSyncCounters();

    try {
      const result = await draftClient.syncPatch(nextEnvelope, session.accessToken);
      draftStore.applyPatchResult(result);
      if (result.status === "acknowledged") {
        setDraftVersionLabel(`v${result.appliedDraftVersion}`);
      }
      setDraftSyncStatus(`Draft patch ${result.status}.`);
    } catch (error) {
      draftStore.markPatchRetrying(nextEnvelope.patchId);
      setDraftSyncError(normalizeApiErrorMessage(error, "Draft sync failed."));
    } finally {
      refreshSyncCounters();
      setIsDraftSyncing(false);
    }
  };

  const onSubmitApplication = async () => {
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    setIsSubmitting(true);

    try {
      const application = await contributionClient.submitApplication(
        {
          postId: params.id,
          message
        },
        session.accessToken
      );

      setApplicationId(application.id);
      setStatusMessage(`Application ${application.id} is ready for review.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to submit application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSyncProjection = async () => {
    if (!session.userId) {
      setProjectionSyncError(
        "A signed-in workspace actor is required before syncing a projection."
      );
      return;
    }

    setIsProjectionSyncing(true);
    setProjectionSyncError(undefined);
    setProjectionSyncStatus(undefined);

    const remoteProjection = projectionStore.getState().remoteProjection;
    const nextEnvelope = {
      version: 1 as const,
      updateId: `upd_${Math.random().toString(16).slice(2)}`,
      projectionId,
      workspaceId: `workspace:${params.id}`,
      targetType: "contribution.workspace" as const,
      targetId: params.id,
      actorId: session.userId,
      clientId: "web-client",
      projectionVersion: remoteProjection?.projectionVersion ?? 0,
      baseDraftVersion: remoteProjection?.projectionVersion ?? 0,
      patch: {
        note: projectionNote
      },
      timestamp: new Date().toISOString()
    };

    projectionStore.enqueueOptimisticUpdate(nextEnvelope);
    refreshSyncCounters();

    try {
      const result = await projectionClient.syncUpdate(nextEnvelope, session.accessToken);
      projectionStore.applyUpdateResult(result);
      if (result.status === "acknowledged") {
        setProjectionVersionLabel(`v${result.appliedProjectionVersion}`);
      }
      setProjectionSyncStatus(`Projection update ${result.status}.`);
    } catch (error) {
      projectionStore.markUpdateRetrying(nextEnvelope.updateId);
      setProjectionSyncError(normalizeApiErrorMessage(error, "Projection sync failed."));
    } finally {
      refreshSyncCounters();
      setIsProjectionSyncing(false);
    }
  };

  const onAcceptApplication = async () => {
    if (!applicationId) {
      return;
    }

    setErrorMessage(undefined);
    setStatusMessage(undefined);
    setIsSubmitting(true);

    try {
      const collaboration = await contributionClient.acceptApplication(
        {
          postId: params.id,
          applicationId
        },
        session.accessToken
      );

      setStatusMessage(
        `Accepted application. Collaboration ${collaboration.id} is now ${collaboration.state}.`
      );
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to accept application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const realtimeTone =
    resolveRealtimeTone(realtime.state) === "success"
      ? "success"
      : resolveRealtimeTone(realtime.state) === "warning"
        ? "warning"
        : resolveRealtimeTone(realtime.state) === "danger"
          ? "danger"
          : "default";

  const draftSurfaceTone = resolveSyncTone(isDraftSyncing, draftSyncError, draftSyncStatus);
  const projectionSurfaceTone = resolveSyncTone(
    isProjectionSyncing,
    projectionSyncError,
    projectionSyncStatus
  );

  const participants = workspaceSessions.participants;
  const hasParticipantSessions = participants.length > 0;

  return (
    <AppShell
      title={post?.title ?? "Contribution Workspace"}
      subtitle="Review collaboration context, manage applications, and keep shared sync surfaces readable."
      contextPanel={
        <>
          <WorkspacePanel
            eyebrow="Collaboration signals"
            title="Current workspace posture"
            description="Participants, connection quality, and sync health are grouped here to keep the collaboration story legible."
          >
            <div className={styles.metricGrid}>
              <MetricCard
                label="Participants"
                value={presence.activeCount}
                helper="Currently visible on this contribution"
              />
              <MetricCard
                label="Sessions"
                value={workspaceSessions.activeCount}
                helper="Active workspace session count"
              />
            </div>
            <StatusBadge label={getRealtimeLabel(realtime.state)} tone={realtimeTone} />
            {!isReady ? (
              <Text variant="caption" tone="warning">
                Restoring saved session context for this workspace.
              </Text>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel
            eyebrow="Workflow"
            title="Why this workspace exists"
            description="Contribution detail is where a request becomes collaborative work without introducing a heavier editor or messaging system."
          >
            <div className={styles.keyValueList}>
              <div className={styles.keyValueItem}>
                <Text variant="label">Applications</Text>
                <Text tone="muted">
                  People can signal intent to help before the route advances into collaboration
                  state.
                </Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Draft sync</Text>
                <Text tone="muted">
                  Shared notes show optimistic progress and acknowledge when the backend catches up.
                </Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Projection sync</Text>
                <Text tone="muted">
                  Lightweight projection updates keep workspace posture visible without changing the
                  realtime architecture.
                </Text>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            eyebrow="Participants"
            title="Session visibility"
            description="The route keeps participant presence visible so collaborators know whether a workspace is actively occupied."
          >
            {hasParticipantSessions ? (
              <div className={styles.participantList}>
                {participants.map((participant) => (
                  <div key={participant.workspaceSessionId} className={styles.participantRow}>
                    <div className={styles.participantMeta}>
                      <Text variant="label">{participant.actorId}</Text>
                      <Text variant="caption" tone="muted">
                        Connections {participant.connectionIds.length}
                      </Text>
                    </div>
                    <StatusBadge label={formatContributionLabel(participant.sessionState)} />
                  </div>
                ))}
              </div>
            ) : (
              <Text tone="muted">No active participant sessions are visible yet.</Text>
            )}
          </WorkspacePanel>
        </>
      }
    >
      {isLoading ? (
        <WorkspacePanel
          eyebrow="Loading"
          title="Hydrating contribution detail"
          description="Pulling the contribution, draft, and projection surfaces into one readable route."
          subtle
        >
          <StatusBadge label="Loading workspace state" tone="warning" />
        </WorkspacePanel>
      ) : !post ? (
        <EmptyState
          title="Contribution not found"
          description="The workspace could not find this contribution. Head back to the queue and pick another contribution surface."
          actions={
            <Link href="/app/contributions" className={styles.linkButton}>
              <Text variant="label">Back to contribution workspace</Text>
            </Link>
          }
        />
      ) : (
        <>
          <div className={styles.metricGrid}>
            <MetricCard
              label="State"
              value={formatContributionLabel(post.state)}
              helper="Current workflow posture"
            />
            <MetricCard
              label="Type"
              value={formatContributionLabel(post.type)}
              helper="Collaboration lane"
            />
            <MetricCard
              label="Difficulty"
              value={formatContributionLabel(post.difficulty)}
              helper="Expected effort signal"
            />
          </div>

          <WorkspacePanel
            eyebrow="Contribution summary"
            title="Readability before action"
            description={post.description}
            actions={<StatusBadge label={formatContributionLabel(post.state)} />}
            footer={
              <Text variant="caption" tone="muted">
                {formatSyncSummary({
                  draftPending: draftPendingCount,
                  projectionPending: projectionPendingCount
                })}
              </Text>
            }
          >
            <div className={styles.keyValueList}>
              <div className={styles.keyValueItem}>
                <Text variant="label">Workspace id</Text>
                <Text tone="muted">{post.id}</Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Credit offer</Text>
                <Text tone="muted">{post.creditOffer} credits</Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Presence</Text>
                <Text tone="muted">{presence.activeCount} active collaborator signals</Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Realtime</Text>
                <Text tone="muted">{getRealtimeLabel(realtime.state)}</Text>
              </div>
            </div>
          </WorkspacePanel>

          <div className={styles.cardList}>
            <WorkspacePanel
              eyebrow="Applications"
              title="Move from interest to collaboration"
              description="Use the existing application flow, but present it with clearer workflow guidance."
            >
              <div className={styles.formGrid}>
                <Stack gap="xs" className={styles.span12}>
                  <Label htmlFor="application-message" requiredIndicator>
                    Application message
                  </Label>
                  <textarea
                    id="application-message"
                    className={styles.textarea}
                    value={message}
                    onChange={(event) => setMessage(event.currentTarget.value)}
                    placeholder="Explain why you are a strong fit for this contribution."
                  />
                </Stack>
                <Stack gap="xs" className={styles.span8}>
                  <Label htmlFor="application-id">Application id</Label>
                  <Input
                    id="application-id"
                    value={applicationId}
                    onChange={(event) => setApplicationId(event.currentTarget.value)}
                    placeholder="Paste the application id to accept it"
                  />
                </Stack>
                <Stack gap="xs" className={styles.span4}>
                  <Label>Workflow note</Label>
                  <Text tone="muted">
                    Submit an application first, then accept it when the workspace is ready to
                    progress.
                  </Text>
                </Stack>
              </div>

              <Stack direction="row" gap="sm" wrap>
                <Button
                  variant="secondary"
                  onClick={() => void onSubmitApplication()}
                  loading={isSubmitting}
                  disabled={!message.trim()}
                >
                  Submit Application
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void onAcceptApplication()}
                  disabled={!applicationId || isSubmitting}
                >
                  Accept Application
                </Button>
              </Stack>
            </WorkspacePanel>

            <WorkspacePanel
              eyebrow="Sync surfaces"
              title="Draft and projection visibility"
              description="These lightweight controls expose optimistic state, retries, and synchronized snapshots without introducing a heavier editor."
            >
              <div className={styles.metricGrid}>
                <MetricCard
                  label="Draft version"
                  value={draftVersionLabel}
                  helper={`${draftPendingCount} pending changes`}
                />
                <MetricCard
                  label="Projection version"
                  value={projectionVersionLabel}
                  helper={`${projectionPendingCount} pending changes`}
                />
              </div>

              <div className={styles.formGrid}>
                <Stack gap="xs" className={styles.span6}>
                  <StatusBadge
                    label={getSyncSurfaceLabel({
                      isSyncing: isDraftSyncing,
                      hasError: Boolean(draftSyncError),
                      hasStatus: Boolean(draftSyncStatus),
                      idleLabel: "Draft idle"
                    })}
                    tone={draftSurfaceTone}
                  />
                  <Label htmlFor="draft-note">Draft note</Label>
                  <textarea
                    id="draft-note"
                    className={styles.textarea}
                    value={draftNote}
                    onChange={(event) => setDraftNote(event.currentTarget.value)}
                    placeholder="Capture the current shared draft context for this contribution."
                  />
                  <Button
                    variant="secondary"
                    onClick={() => void onSyncDraft()}
                    loading={isDraftSyncing}
                  >
                    Sync Draft Patch
                  </Button>
                  {draftSyncStatus ? (
                    <Text variant="caption" tone="success">
                      {draftSyncStatus}
                    </Text>
                  ) : null}
                  {draftSyncError ? (
                    <Text variant="caption" tone="danger">
                      {draftSyncError}
                    </Text>
                  ) : null}
                </Stack>

                <Stack gap="xs" className={styles.span6}>
                  <StatusBadge
                    label={getSyncSurfaceLabel({
                      isSyncing: isProjectionSyncing,
                      hasError: Boolean(projectionSyncError),
                      hasStatus: Boolean(projectionSyncStatus),
                      idleLabel: "Projection idle"
                    })}
                    tone={projectionSurfaceTone}
                  />
                  <Label htmlFor="projection-note">Projection note</Label>
                  <textarea
                    id="projection-note"
                    className={styles.textarea}
                    value={projectionNote}
                    onChange={(event) => setProjectionNote(event.currentTarget.value)}
                    placeholder="Project the latest workspace state for collaborators."
                  />
                  <Button
                    variant="secondary"
                    onClick={() => void onSyncProjection()}
                    loading={isProjectionSyncing}
                  >
                    Sync Projection Update
                  </Button>
                  {projectionSyncStatus ? (
                    <Text variant="caption" tone="success">
                      {projectionSyncStatus}
                    </Text>
                  ) : null}
                  {projectionSyncError ? (
                    <Text variant="caption" tone="danger">
                      {projectionSyncError}
                    </Text>
                  ) : null}
                </Stack>
              </div>
            </WorkspacePanel>
          </div>

          {workspaceSessions.workspaceId ? (
            <WorkspacePanel
              eyebrow="Workspace session"
              title="Shared occupancy"
              description="Session visibility stays lightweight but still tells the story of whether this contribution is actively being worked."
            >
              <div className={styles.keyValueList}>
                <div className={styles.keyValueItem}>
                  <Text variant="label">Workspace id</Text>
                  <Text tone="muted">{workspaceSessions.workspaceId}</Text>
                </div>
                <div className={styles.keyValueItem}>
                  <Text variant="label">Active sessions</Text>
                  <Text tone="muted">{workspaceSessions.activeCount}</Text>
                </div>
              </div>
            </WorkspacePanel>
          ) : null}
        </>
      )}

      {errorMessage ? (
        <WorkspacePanel
          eyebrow="Needs attention"
          title="The workspace hit an error"
          description={errorMessage}
          subtle
        >
          <StatusBadge label="Action needed" tone="danger" />
        </WorkspacePanel>
      ) : null}

      {statusMessage ? (
        <WorkspacePanel
          eyebrow="Workspace update"
          title="The collaboration state changed"
          description={statusMessage}
          subtle
        >
          <StatusBadge label="Saved" tone="success" />
        </WorkspacePanel>
      ) : null}
    </AppShell>
  );
}
