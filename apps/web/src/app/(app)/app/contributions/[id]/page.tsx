"use client";

import { Button, Input, Label, Stack, Text } from "@contriskill/ui";
import { Card, CardBody, CardHeader } from "@contriskill/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ContributionPost } from "../../../../../lib/api/contribution-client";
import { ApiClientError } from "../../../../../lib/api/types";
import { createDraftSyncStore } from "../../../../../lib/drafts";
import { createProjectionSyncStore } from "../../../../../lib/projections";
import { useContributionPresence } from "../../../../../lib/realtime/presence";
import {
  contributionDraftSubscription,
  contributionDetailSubscription,
  contributionProjectionSubscription
} from "../../../../../lib/realtime/subscriptions";
import { useContributionWorkspaceSessions } from "../../../../../lib/realtime/workspace-sessions";
import { formatSyncSummary, resolveRealtimeTone } from "../../../../../lib/ui/workspace-status";
import { useApiClient } from "../../../../../providers/api-client-provider";
import {
  useRealtime,
  useRealtimeEvent,
  useRealtimeSubscription
} from "../../../../../providers/realtime-provider";
import type { RealtimeUiEvent } from "../../../../../providers/realtime-provider";
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

export default function ContributionDetailPage({ params }: ContributionDetailPageProps) {
  const { contributionClient, draftClient, projectionClient } = useApiClient();
  const { session } = useSession();
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
      setStatusMessage(`Submitted application ${application.id}.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to submit application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSyncProjection = async () => {
    if (!session.userId) {
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
      setStatusMessage(`Accepted application. Collaboration ${collaboration.id} created.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to accept application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Contribution Detail"
      subtitle="Coordinate applications and collaboration state for this contribution."
    >
      <Stack gap="lg">
        {isLoading ? (
          <Text tone="muted">Loading contribution detail...</Text>
        ) : post ? (
          <Card variant="elevated">
            <CardHeader>
              <Text variant="subtitle">{post.title}</Text>
              <Text tone="muted">{post.description}</Text>
            </CardHeader>
            <CardBody>
              <Stack gap="xs">
                <Text variant="caption">
                  {post.id} • {post.type} • {post.difficulty} • {post.state}
                </Text>
                <Text variant="caption" tone="muted">
                  Active collaborators: {presence.activeCount}
                </Text>
                <Text variant="caption" tone={resolveRealtimeTone(realtime.state)}>
                  Realtime state: {realtime.state}
                </Text>
                <Text variant="caption" tone="muted">
                  Workspace sessions: {workspaceSessions.activeCount}
                </Text>
                {workspaceSessions.workspaceId ? (
                  <Text variant="caption" tone="muted">
                    Workspace: {workspaceSessions.workspaceId}
                  </Text>
                ) : null}
                {workspaceSessions.participants.length > 0 ? (
                  <Text variant="caption" tone="muted">
                    Participants:{" "}
                    {workspaceSessions.participants
                      .map((participant) => `${participant.actorId} (${participant.sessionState})`)
                      .join(", ")}
                  </Text>
                ) : (
                  <Text variant="caption" tone="muted">
                    No active participant sessions yet.
                  </Text>
                )}
                <Text variant="caption" tone="muted">
                  {formatSyncSummary({
                    draftPending: draftPendingCount,
                    projectionPending: projectionPendingCount
                  })}
                </Text>
              </Stack>
            </CardBody>
          </Card>
        ) : (
          <Card variant="subtle">
            <CardBody>
              <Stack gap="xs">
                <Text tone="muted">Contribution not found.</Text>
                <Link href="/app/contributions">Back to Contributions</Link>
              </Stack>
            </CardBody>
          </Card>
        )}

        <div className="cs-panel-grid">
          <Card variant="outlined">
            <CardHeader>
              <Text variant="subtitle">Application Actions</Text>
              <Text variant="caption" tone="muted">
                Submit and accept collaboration applications.
              </Text>
            </CardHeader>
            <CardBody>
              <Stack gap="sm">
                <Stack gap="xs">
                  <Label htmlFor="application-message">Application Message</Label>
                  <Input
                    id="application-message"
                    value={message}
                    onChange={(event) => setMessage(event.currentTarget.value)}
                  />
                </Stack>
                <Button
                  variant="secondary"
                  onClick={() => void onSubmitApplication()}
                  loading={isSubmitting}
                  disabled={!message}
                >
                  Submit Application
                </Button>
                <Stack gap="xs">
                  <Label htmlFor="application-id">Application ID</Label>
                  <Input
                    id="application-id"
                    value={applicationId}
                    onChange={(event) => setApplicationId(event.currentTarget.value)}
                    placeholder="Paste or use submitted application id"
                  />
                </Stack>
                <Button
                  variant="ghost"
                  onClick={() => void onAcceptApplication()}
                  disabled={!applicationId || isSubmitting}
                >
                  Accept Application
                </Button>
              </Stack>
            </CardBody>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <Text variant="subtitle">Draft + Projection Coordination</Text>
              <Text variant="caption" tone="muted">
                Lightweight sync surfaces for collaboration state.
              </Text>
            </CardHeader>
            <CardBody>
              <Stack gap="sm">
                <Stack gap="xs">
                  <Text variant="label">Draft sync ({draftVersionLabel})</Text>
                  <Label htmlFor="draft-note">Draft Note</Label>
                  <Input
                    id="draft-note"
                    value={draftNote}
                    onChange={(event) => setDraftNote(event.currentTarget.value)}
                    placeholder="Add draft note for contribution coordination"
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

                <Stack gap="xs">
                  <Text variant="label">Projection sync ({projectionVersionLabel})</Text>
                  <Label htmlFor="projection-note">Projection Note</Label>
                  <Input
                    id="projection-note"
                    value={projectionNote}
                    onChange={(event) => setProjectionNote(event.currentTarget.value)}
                    placeholder="Project workspace state for collaborators"
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
              </Stack>
            </CardBody>
          </Card>
        </div>

        {workspaceSessions.workspaceId ? (
          <Card variant="subtle">
            <CardHeader>
              <Text variant="subtitle">Participant Session Awareness</Text>
            </CardHeader>
            <CardBody>
              <Text variant="caption" tone="muted">
                Workspace: {workspaceSessions.workspaceId} | Active sessions:{" "}
                {workspaceSessions.activeCount}
              </Text>
            </CardBody>
          </Card>
        ) : null}

        {errorMessage ? (
          <Text variant="caption" tone="danger">
            {errorMessage}
          </Text>
        ) : null}
        {statusMessage ? (
          <Text variant="caption" tone="success">
            {statusMessage}
          </Text>
        ) : null}
      </Stack>
    </AppShell>
  );
}
