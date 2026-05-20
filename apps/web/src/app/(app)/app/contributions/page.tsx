"use client";

import type { ContributionDifficulty, ContributionType } from "@contriskill/domain";
import { Button, Input, Label, Stack, Text } from "@contriskill/ui";
import { useEffect, useMemo, useState } from "react";

import { ApiClientError } from "../../../../lib/api/types";
import { useApiClient } from "../../../../providers/api-client-provider";
import { useSession } from "../../../../providers/session-provider";
import { AppShell } from "../_components/app-shell";

import { ContributionCard } from "./_components/contribution-card";

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

  const [posts, setPosts] = useState<
    Awaited<ReturnType<typeof contributionClient.listPosts>>["items"]
  >([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const [stateFilter, setStateFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");

  const loadContributions = async (cursor?: string) => {
    const result = await contributionClient.listPosts(
      {
        limit: 10,
        ...(cursor ? { cursor } : {}),
        ...(stateFilter ? { state: stateFilter as never } : {}),
        ...(typeFilter ? { type: typeFilter as never } : {}),
        ...(difficultyFilter ? { difficulty: difficultyFilter as never } : {})
      },
      session.accessToken
    );

    if (cursor) {
      setPosts((current: typeof posts) => [...current, ...result.items]);
    } else {
      setPosts(result.items);
    }
    setNextCursor(result.page.nextCursor);
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setErrorMessage(undefined);
      try {
        await loadContributions();
      } catch (error) {
        setErrorMessage(normalizeApiErrorMessage(error, "Failed to load contributions."));
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [session.accessToken, stateFilter, typeFilter, difficultyFilter]);

  const canSubmit = useMemo(() => {
    return Boolean(title && description && creditOffer);
  }, [title, description, creditOffer]);

  const onCreateContribution = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    try {
      const created = await contributionClient.createPost(
        {
          type,
          title,
          description,
          difficulty,
          creditOffer: Number(creditOffer)
        },
        session.accessToken
      );
      setPosts((current: typeof posts) => [created, ...current]);
      setTitle("");
      setDescription("");
      setStatusMessage(`Created contribution ${created.id}.`);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to create contribution."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLoadMore = async () => {
    if (!nextCursor) {
      return;
    }
    setIsLoadingMore(true);
    setErrorMessage(undefined);
    try {
      await loadContributions(nextCursor);
    } catch (error) {
      setErrorMessage(normalizeApiErrorMessage(error, "Failed to load more contributions."));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <AppShell title="Contributions" subtitle="Discover and create contribution posts.">
      <Stack gap="lg">
        <Stack gap="sm">
          <Text variant="subtitle">Create Contribution</Text>
          <Stack gap="xs">
            <Label htmlFor="contribution-title">Title</Label>
            <Input
              id="contribution-title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </Stack>
          <Stack gap="xs">
            <Label htmlFor="contribution-description">Description</Label>
            <Input
              id="contribution-description"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
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

        <Stack gap="sm">
          <Text variant="subtitle">Browse Contributions</Text>
          <Stack direction="row" gap="sm">
            <Input
              aria-label="Filter by post state"
              placeholder="state (optional)"
              value={stateFilter}
              onChange={(event) => setStateFilter(event.currentTarget.value)}
            />
            <Input
              aria-label="Filter by contribution type"
              placeholder="type (optional)"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.currentTarget.value)}
            />
            <Input
              aria-label="Filter by difficulty"
              placeholder="difficulty (optional)"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.currentTarget.value)}
            />
          </Stack>
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

        {isLoading ? (
          <Text tone="muted">Loading contributions...</Text>
        ) : posts.length === 0 ? (
          <Text tone="muted">No contributions found for the current filters.</Text>
        ) : (
          <Stack gap="sm">
            {posts.map((post: (typeof posts)[number]) => (
              <ContributionCard key={post.id} post={post} />
            ))}
          </Stack>
        )}

        {nextCursor ? (
          <Button variant="secondary" onClick={() => void onLoadMore()} loading={isLoadingMore}>
            Load More
          </Button>
        ) : null}
      </Stack>
    </AppShell>
  );
}
