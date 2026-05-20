"use client";

import { Button, Input, Label, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ContributionPost } from "../../../../../lib/api/contribution-client";
import { ApiClientError } from "../../../../../lib/api/types";
import { createDraftSyncStore } from "../../../../../lib/drafts";
import { useContributionPresence } from "../../../../../lib/realtime/presence";
import {
  contributionDraftSubscription,
  contributionDetailSubscription
} from "../../../../../lib/realtime/subscriptions";
import { useApiClient } from "../../../../../providers/api-client-provider";
import {
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
  const { contributionClient, draftClient } = useApiClient();
  const { session } = useSession();
  const presence = useContributionPresence(params.id);
  const draftStore = useMemo(() => createDraftSyncStore(), []);
  const draftId = useMemo(() => `draft:contribution:${params.id}`, [params.id]);

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

  useRealtimeSubscription(contributionDetailSubscription(params.id));
  useRealtimeSubscription(contributionDraftSubscription(params.id));
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
          }

          return;
        }
        void loadContributionDetail();
      },
      [draftStore, loadContributionDetail, loadDraftSnapshot, params.id]
    )
  );

  useEffect(() => {
    void loadContributionDetail();
    void loadDraftSnapshot();
  }, [loadContributionDetail, loadDraftSnapshot]);

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
      subtitle="Read contribution detail and test application flow."
    >
      <Stack gap="lg">
        {isLoading ? (
          <Text tone="muted">Loading contribution detail...</Text>
        ) : post ? (
          <Stack gap="xs">
            <Text variant="subtitle">{post.title}</Text>
            <Text tone="muted">{post.description}</Text>
            <Text variant="caption">
              {post.id} - {post.type} - {post.difficulty} - {post.state}
            </Text>
            <Text variant="caption" tone="muted">
              Active collaborators: {presence.activeCount}
            </Text>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Text tone="muted">Contribution not found.</Text>
            <Link href="/app/contributions">Back to Contributions</Link>
          </Stack>
        )}

        <Stack gap="sm">
          <Text variant="subtitle">Application Actions</Text>
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

        <Stack gap="sm">
          <Text variant="subtitle">Shared Draft Synchronization</Text>
          <Text variant="caption" tone="muted">
            Draft shell state {draftVersionLabel}
          </Text>
          <Stack gap="xs">
            <Label htmlFor="draft-note">Draft Note</Label>
            <Input
              id="draft-note"
              value={draftNote}
              onChange={(event) => setDraftNote(event.currentTarget.value)}
              placeholder="Add draft note for contribution coordination"
            />
          </Stack>
          <Button variant="secondary" onClick={() => void onSyncDraft()} loading={isDraftSyncing}>
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
