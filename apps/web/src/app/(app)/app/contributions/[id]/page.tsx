"use client";

import { Button, Input, Label, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { ContributionPost } from "../../../../../lib/api/contribution-client";
import { ApiClientError } from "../../../../../lib/api/types";
import { contributionDetailSubscription } from "../../../../../lib/realtime/subscriptions";
import { useApiClient } from "../../../../../providers/api-client-provider";
import {
  useRealtimeEvent,
  useRealtimeSubscription
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

export default function ContributionDetailPage({ params }: ContributionDetailPageProps) {
  const { contributionClient } = useApiClient();
  const { session } = useSession();

  const [post, setPost] = useState<ContributionPost | undefined>();
  const [message, setMessage] = useState("I can help with this contribution.");
  const [applicationId, setApplicationId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useRealtimeSubscription(contributionDetailSubscription(params.id));
  useRealtimeEvent(
    useCallback(
      (event) => {
        if (event.topicHint !== `contribution:${params.id}`) {
          return;
        }
        if (
          event.eventName !== "contribution.post.created.v1" &&
          event.eventName !== "contribution.post.updated.v1" &&
          event.eventName !== "contribution.post.state_changed.v1"
        ) {
          return;
        }
        void loadContributionDetail();
      },
      [loadContributionDetail, params.id]
    )
  );

  useEffect(() => {
    void loadContributionDetail();
  }, [loadContributionDetail]);

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
              {post.id} • {post.type} • {post.difficulty} • {post.state}
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
