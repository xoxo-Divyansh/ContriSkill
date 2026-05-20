"use client";

import { Button, Card, CardBody, CardHeader, Input, Label, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ApiClientError } from "../../../../../lib/api/types";
import { useApiClient } from "../../../../../providers/api-client-provider";
import { useSession } from "../../../../../providers/session-provider";
import { AppShell } from "../../_components/app-shell";
import {
  loadContributionWorkspaceState,
  saveContributionWorkspaceState
} from "../_lib/contribution-state";

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

  const [workspaceState, setWorkspaceState] = useState(loadContributionWorkspaceState());
  const post = useMemo(
    () => workspaceState.posts.find((item) => item.id === params.id),
    [params.id, workspaceState.posts]
  );
  const [message, setMessage] = useState("I can help with this contribution.");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestApplicationForPost = useMemo(
    () => workspaceState.applications.find((application) => application.postId === params.id),
    [params.id, workspaceState.applications]
  );

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

      const nextState = {
        ...workspaceState,
        applications: [application, ...workspaceState.applications]
      };
      setWorkspaceState(nextState);
      saveContributionWorkspaceState(nextState);
      setStatusMessage(`Submitted application ${application.id}.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to submit application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAcceptApplication = async () => {
    if (!latestApplicationForPost) {
      return;
    }

    setErrorMessage(undefined);
    setStatusMessage(undefined);
    setIsSubmitting(true);
    try {
      const collaboration = await contributionClient.acceptApplication(
        {
          postId: params.id,
          applicationId: latestApplicationForPost.id
        },
        session.accessToken
      );

      const nextState = {
        ...workspaceState,
        collaborations: [collaboration, ...workspaceState.collaborations]
      };
      setWorkspaceState(nextState);
      saveContributionWorkspaceState(nextState);
      setStatusMessage(`Accepted application ${latestApplicationForPost.id}.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to accept application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Contribution Detail"
      subtitle="Manage application actions for this contribution."
    >
      <Stack gap="lg">
        <Card variant="subtle">
          <CardHeader>
            <Text variant="subtitle">Contribution</Text>
          </CardHeader>
          <CardBody>
            {post ? (
              <Stack gap="xs">
                <Text variant="label">{post.title}</Text>
                <Text tone="muted">{post.description}</Text>
                <Text variant="caption">
                  {post.id} — {post.state}
                </Text>
              </Stack>
            ) : (
              <Stack gap="xs">
                <Text tone="muted">
                  Contribution not found in local workspace state. Return to contributions list.
                </Text>
                <Link href="/app/contributions">Back to Contributions</Link>
              </Stack>
            )}
          </CardBody>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <Text variant="subtitle">Application Actions</Text>
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
              <Stack direction="row" gap="sm">
                <Button
                  variant="secondary"
                  onClick={() => void onSubmitApplication()}
                  loading={isSubmitting}
                  disabled={!message}
                >
                  Submit Application
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void onAcceptApplication()}
                  disabled={!latestApplicationForPost || isSubmitting}
                >
                  Accept Latest Application
                </Button>
              </Stack>
            </Stack>
          </CardBody>
        </Card>

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
