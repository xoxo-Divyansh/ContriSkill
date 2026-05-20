"use client";

import type { ContributionDifficulty, ContributionType } from "@contriskill/domain";
import { Button, Card, CardBody, CardHeader, Input, Label, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ContributionPost } from "../../../../lib/api/contribution-client";
import { ApiClientError } from "../../../../lib/api/types";
import { useApiClient } from "../../../../providers/api-client-provider";
import { useSession } from "../../../../providers/session-provider";
import { AppShell } from "../_components/app-shell";

import {
  loadContributionWorkspaceState,
  saveContributionWorkspaceState
} from "./_lib/contribution-state";

const contributionTypes: ContributionType[] = [
  "mentorship",
  "collaboration",
  "problem_solving",
  "educational",
  "community_safety"
];

const contributionDifficulties: ContributionDifficulty[] = ["low", "medium", "high"];

const normalizeApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
};

export default function ContributionsPage() {
  const { contributionClient } = useApiClient();
  const { session } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContributionType>("mentorship");
  const [difficulty, setDifficulty] = useState<ContributionDifficulty>("medium");
  const [creditOffer, setCreditOffer] = useState("50");
  const [posts, setPosts] = useState<ContributionPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    const storedState = loadContributionWorkspaceState();
    setPosts(storedState.posts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const previous = loadContributionWorkspaceState();
    saveContributionWorkspaceState({
      ...previous,
      posts
    });
  }, [isLoading, posts]);

  const canSubmit = useMemo(() => {
    return Boolean(title && description && creditOffer);
  }, [title, description, creditOffer]);

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
        session.accessToken
      );

      setPosts((current) => [post, ...current]);
      setTitle("");
      setDescription("");
      setStatusMessage(`Created contribution ${post.id}.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to create contribution."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRefreshLocalState = () => {
    const nextState = loadContributionWorkspaceState();
    setPosts(nextState.posts);
    setStatusMessage("Refreshed contribution workspace.");
    setErrorMessage(undefined);
  };

  return (
    <AppShell
      title="Contributions"
      subtitle="Create contributions and review recent contribution state."
    >
      <Stack gap="lg">
        <Card variant="elevated">
          <CardHeader>
            <Text variant="subtitle">Create Contribution</Text>
            <Text variant="caption" tone="muted">
              Uses current contribution API contracts.
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
                  placeholder="Need support for implementation review"
                />
              </Stack>
              <Stack gap="xs">
                <Label htmlFor="contribution-description">Description</Label>
                <Input
                  id="contribution-description"
                  value={description}
                  onChange={(event) => setDescription(event.currentTarget.value)}
                  placeholder="Describe contribution expectations"
                />
              </Stack>
              <Stack direction="row" gap="sm">
                <Stack gap="xs">
                  <Label htmlFor="contribution-type">Type</Label>
                  <select
                    id="contribution-type"
                    name="contribution-type"
                    aria-label="Contribution type"
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
                    name="contribution-difficulty"
                    aria-label="Contribution difficulty"
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
                disabled={!canSubmit}
              >
                Create Contribution
              </Button>
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
            <Text variant="subtitle">Recent Contributions</Text>
          </CardHeader>
          <CardBody>
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="caption" tone="muted">
                Local workspace state is persisted for this browser profile.
              </Text>
              <Button variant="ghost" onClick={onRefreshLocalState} disabled={isLoading}>
                Refresh
              </Button>
            </Stack>
            {isLoading ? (
              <Text tone="muted">Loading contribution workspace...</Text>
            ) : posts.length === 0 ? (
              <Text tone="muted">No contributions yet. Create one to begin.</Text>
            ) : (
              <Stack gap="xs">
                {posts.map((post) => (
                  <Text key={post.id} variant="caption">
                    <Link href={`/app/contributions/${post.id}`}>
                      {post.title} ({post.state}) - {post.id}
                    </Link>
                  </Text>
                ))}
              </Stack>
            )}
          </CardBody>
        </Card>
      </Stack>
    </AppShell>
  );
}
