"use client";

import type { ContributionDifficulty, ContributionType } from "@contriskill/domain";
import { Button, Card, CardBody, CardHeader, Input, Label, Stack, Text } from "@contriskill/ui";
import { useState } from "react";

import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionPost
} from "../../../lib/api/contribution-client";
import { ApiClientError } from "../../../lib/api/types";
import { useApiClient } from "../../../providers/api-client-provider";
import { useSession } from "../../../providers/session-provider";

const contributionTypes: ContributionType[] = [
  "mentorship",
  "collaboration",
  "problem_solving",
  "educational",
  "community_safety"
];

const contributionDifficulties: ContributionDifficulty[] = ["low", "medium", "high"];

export default function ProtectedAppHomePage() {
  const { contributionClient } = useApiClient();
  const { session } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContributionType>("mentorship");
  const [difficulty, setDifficulty] = useState<ContributionDifficulty>("medium");
  const [creditOffer, setCreditOffer] = useState("50");
  const [postId, setPostId] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");

  const [createdPosts, setCreatedPosts] = useState<ContributionPost[]>([]);
  const [applications, setApplications] = useState<ContributionApplication[]>([]);
  const [acceptedCollaborations, setAcceptedCollaborations] = useState<ContributionCollaboration[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const accessToken = session.accessToken;

  const onCreateContribution = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    try {
      const post = await contributionClient.createPost(
        {
          type,
          title,
          description,
          difficulty,
          creditOffer: Number(creditOffer)
        },
        accessToken
      );
      setCreatedPosts((current) => [post, ...current]);
      setPostId(post.id);
      setTitle("");
      setDescription("");
      setStatusMessage(`Created contribution ${post.id}.`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to create contribution.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitApplication = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    try {
      const application = await contributionClient.submitApplication(
        {
          postId,
          message: applicationMessage
        },
        accessToken
      );
      setApplications((current) => [application, ...current]);
      setApplicationMessage("");
      setStatusMessage(`Submitted application ${application.id}.`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to submit application.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAcceptLatestApplication = async () => {
    const latest = applications[0];
    if (!latest) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    try {
      const collaboration = await contributionClient.acceptApplication(
        {
          postId: latest.postId,
          applicationId: latest.id
        },
        accessToken
      );
      setAcceptedCollaborations((current) => [collaboration, ...current]);
      setStatusMessage(
        `Accepted application ${latest.id}. Collaboration ${collaboration.id} created.`
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to accept application.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <Stack gap="lg">
        <Card variant="elevated">
          <CardHeader>
            <Text variant="subtitle">Create Contribution</Text>
            <Text variant="caption" tone="muted">
              Minimal vertical slice over current API foundation.
            </Text>
          </CardHeader>
          <CardBody>
            <Stack gap="sm">
              <Stack gap="xs">
                <Label htmlFor="contribution-title">Title</Label>
                <Input
                  id="contribution-title"
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  placeholder="Need help with API integration"
                />
              </Stack>
              <Stack gap="xs">
                <Label htmlFor="contribution-description">Description</Label>
                <Input
                  id="contribution-description"
                  value={description}
                  onChange={(event) => setDescription(event.currentTarget.value)}
                  placeholder="Describe what support is needed"
                />
              </Stack>
              <Stack direction="row" gap="sm">
                <Stack gap="xs">
                  <Label htmlFor="contribution-type">Type</Label>
                  <select
                    id="contribution-type"
                    value={type}
                    onChange={(event) => setType(event.currentTarget.value as ContributionType)}
                  >
                    {contributionTypes.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Stack>
                <Stack gap="xs">
                  <Label htmlFor="contribution-difficulty">Difficulty</Label>
                  <select
                    id="contribution-difficulty"
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.currentTarget.value as ContributionDifficulty)
                    }
                  >
                    {contributionDifficulties.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Stack>
                <Stack gap="xs">
                  <Label htmlFor="contribution-credit">Credit Offer</Label>
                  <Input
                    id="contribution-credit"
                    inputMode="numeric"
                    value={creditOffer}
                    onChange={(event) => setCreditOffer(event.currentTarget.value)}
                  />
                </Stack>
              </Stack>
              <Button
                onClick={() => void onCreateContribution()}
                loading={isSubmitting}
                disabled={!title || !description || !creditOffer}
              >
                Create Contribution
              </Button>
            </Stack>
          </CardBody>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <Text variant="subtitle">Application Shell</Text>
            <Text variant="caption" tone="muted">
              Submit and accept application using current endpoints.
            </Text>
          </CardHeader>
          <CardBody>
            <Stack gap="sm">
              <Stack gap="xs">
                <Label htmlFor="application-post-id">Target Post ID</Label>
                <Input
                  id="application-post-id"
                  value={postId}
                  onChange={(event) => setPostId(event.currentTarget.value)}
                  placeholder="post_xxx"
                />
              </Stack>
              <Stack gap="xs">
                <Label htmlFor="application-message">Message</Label>
                <Input
                  id="application-message"
                  value={applicationMessage}
                  onChange={(event) => setApplicationMessage(event.currentTarget.value)}
                  placeholder="I can help with this task"
                />
              </Stack>
              <Stack direction="row" gap="sm">
                <Button
                  variant="secondary"
                  onClick={() => void onSubmitApplication()}
                  loading={isSubmitting}
                  disabled={!postId || !applicationMessage}
                >
                  Submit Application
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void onAcceptLatestApplication()}
                  disabled={applications.length === 0 || isSubmitting}
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

        <Card variant="subtle">
          <CardHeader>
            <Text variant="subtitle">Contribution Listing Shell</Text>
          </CardHeader>
          <CardBody>
            <Stack gap="xs">
              {createdPosts.length === 0 ? (
                <Text tone="muted">No contributions created in this session yet.</Text>
              ) : (
                createdPosts.map((post) => (
                  <Text key={post.id} variant="caption">
                    {post.id} - {post.title} ({post.state})
                  </Text>
                ))
              )}
            </Stack>
            <Stack gap="xs">
              <Text variant="label">Applications</Text>
              {applications.length === 0 ? (
                <Text tone="muted">No applications submitted in this session yet.</Text>
              ) : (
                applications.map((application) => (
                  <Text key={application.id} variant="caption">
                    {application.id} {"->"} {application.postId}
                  </Text>
                ))
              )}
            </Stack>
            <Stack gap="xs">
              <Text variant="label">Collaborations</Text>
              {acceptedCollaborations.length === 0 ? (
                <Text tone="muted">No collaborations accepted in this session yet.</Text>
              ) : (
                acceptedCollaborations.map((collaboration) => (
                  <Text key={collaboration.id} variant="caption">
                    {collaboration.id} {"->"} {collaboration.state}
                  </Text>
                ))
              )}
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </main>
  );
}
