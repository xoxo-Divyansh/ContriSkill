"use client";

import type { ContributionDifficulty, ContributionType } from "@contriskill/domain";
import { Button, Input, Label, Stack, Text } from "@contriskill/ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  EmptyState,
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../../../../components/workspace/workspace-foundation";
import styles from "../../../../components/workspace/workspace-foundation.module.css";
import type { ContributionPost } from "../../../../lib/api/contribution-client";
import { ApiClientError } from "../../../../lib/api/types";
import { contributionListSubscription } from "../../../../lib/realtime/subscriptions";
import { getRealtimeLabel, resolveRealtimeTone } from "../../../../lib/ui/workspace-status";
import { useApiClient } from "../../../../providers/api-client-provider";
import {
  useRealtime,
  useRealtimeEvent,
  useRealtimeSubscription,
  type RealtimeUiEvent
} from "../../../../providers/realtime-provider";
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

const formatContributionLabel = (value: string) => {
  return value
    .split("_")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
};

export default function ContributionsPage() {
  const { contributionClient } = useApiClient();
  const { session, isReady } = useSession();
  const realtime = useRealtime();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContributionType>("mentorship");
  const [difficulty, setDifficulty] = useState<ContributionDifficulty>("medium");
  const [creditOffer, setCreditOffer] = useState("50");

  const [posts, setPosts] = useState<ContributionPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");

  const loadContributions = useCallback(
    async (cursor?: string) => {
      const result = await contributionClient.listPosts(
        {
          limit: 10,
          ...(cursor ? { cursor } : {}),
          ...(stateFilter ? { state: stateFilter as ContributionPost["state"] } : {}),
          ...(typeFilter ? { type: typeFilter as ContributionPost["type"] } : {}),
          ...(difficultyFilter
            ? { difficulty: difficultyFilter as ContributionPost["difficulty"] }
            : {})
        },
        session.accessToken
      );

      if (cursor) {
        setPosts((current) => [...current, ...result.items]);
      } else {
        setPosts(result.items);
      }

      setNextCursor(result.page.nextCursor);
    },
    [contributionClient, difficultyFilter, session.accessToken, stateFilter, typeFilter]
  );

  useRealtimeSubscription(contributionListSubscription());
  useRealtimeEvent(
    useCallback(
      (event: RealtimeUiEvent) => {
        if (event.topicHint !== "contribution:list") {
          return;
        }

        if (
          event.eventName !== "contribution.post.created.v1" &&
          event.eventName !== "contribution.post.updated.v1" &&
          event.eventName !== "contribution.post.state_changed.v1"
        ) {
          return;
        }

        void (async () => {
          setIsRefreshing(true);
          try {
            await loadContributions();
          } finally {
            setIsRefreshing(false);
          }
        })();
      },
      [loadContributions]
    )
  );

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
  }, [loadContributions, session.accessToken]);

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && description.trim() && creditOffer.trim());
  }, [creditOffer, description, title]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return posts;
    }

    return posts.filter((post) => {
      const haystack = [
        post.title,
        post.description,
        post.id,
        post.type,
        post.difficulty,
        post.state
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [posts, searchQuery]);

  const hasFilters = Boolean(searchQuery || stateFilter || typeFilter || difficultyFilter);

  const onCreateContribution = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setStatusMessage(undefined);

    try {
      const created = await contributionClient.createPost(
        {
          type,
          title: title.trim(),
          description: description.trim(),
          difficulty,
          creditOffer: Number(creditOffer)
        },
        session.accessToken
      );

      setPosts((current) => [created, ...current]);
      setTitle("");
      setDescription("");
      setStatusMessage(`Contribution ${created.title} is now visible to the workspace.`);
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

  const onResetFilters = () => {
    setSearchQuery("");
    setStateFilter("");
    setTypeFilter("");
    setDifficultyFilter("");
  };

  const realtimeTone =
    resolveRealtimeTone(realtime.state) === "success"
      ? "success"
      : resolveRealtimeTone(realtime.state) === "danger"
        ? "danger"
        : "warning";

  return (
    <AppShell
      title="Contribution Workspace"
      subtitle="Frame new work, discover active requests, and keep collaboration posture visible from one route."
      contextPanel={
        <>
          <WorkspacePanel
            eyebrow="Workspace posture"
            title="Contribution lane health"
            description="This route keeps search, sync, and participation cues readable so new contributors can orient quickly."
          >
            <div className={styles.metricGrid}>
              <MetricCard
                label="Visible contributions"
                value={filteredPosts.length}
                helper={hasFilters ? "After current filters" : "Current workspace queue"}
              />
              <MetricCard
                label="Realtime"
                value={realtime.state === "connected" ? "Live" : "Degraded"}
                helper="Connection state for shared updates"
              />
            </div>
            <StatusBadge label={getRealtimeLabel(realtime.state)} tone={realtimeTone} />
            {!isReady ? (
              <Text variant="caption" tone="warning">
                Restoring saved session context before the workspace settles.
              </Text>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel
            eyebrow="How to onboard"
            title="What belongs in a contribution"
            description="Requests work best when they describe the need, the difficulty, and the collaboration shape expected from the workspace."
          >
            <div className={styles.keyValueList}>
              <div className={styles.keyValueItem}>
                <Text variant="label">Frame the need</Text>
                <Text tone="muted">
                  Use the title and description to make the collaboration outcome immediately
                  legible.
                </Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Signal effort</Text>
                <Text tone="muted">
                  Difficulty and credit help contributors judge whether they can confidently step
                  in.
                </Text>
              </div>
              <div className={styles.keyValueItem}>
                <Text variant="label">Stay aware</Text>
                <Text tone="muted">
                  Realtime refresh keeps the list current without changing the underlying backend
                  flow.
                </Text>
              </div>
            </div>
          </WorkspacePanel>
        </>
      }
    >
      <div className={styles.metricGrid}>
        <MetricCard
          label="Create flow"
          value="Guided"
          helper="Structured request framing for first-time contributors"
        />
        <MetricCard
          label="Discovery"
          value="Sharper"
          helper="Search, filters, and clearer card hierarchy"
        />
        <MetricCard
          label="Sync visibility"
          value="Calm"
          helper="Refresh and session cues stay visible"
        />
      </div>

      <WorkspacePanel
        eyebrow="Create contribution"
        title="Open a new collaboration request"
        description="Give the workspace enough context to understand what help is needed and how urgent or complex it feels."
        footer={
          <Text variant="caption" tone="muted">
            New contributions appear in the shared list without changing the existing backend
            contract.
          </Text>
        }
      >
        <div className={styles.formGrid}>
          <Stack gap="xs" className={styles.span8}>
            <Label htmlFor="contribution-title" requiredIndicator>
              Title
            </Label>
            <Input
              id="contribution-title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Design a profile verification workflow"
            />
          </Stack>
          <Stack gap="xs" className={styles.span4}>
            <Label htmlFor="contribution-credit" requiredIndicator>
              Credit offer
            </Label>
            <Input
              id="contribution-credit"
              inputMode="numeric"
              value={creditOffer}
              onChange={(event) => setCreditOffer(event.currentTarget.value)}
            />
          </Stack>
          <Stack gap="xs" className={styles.span12}>
            <Label htmlFor="contribution-description" requiredIndicator>
              Collaboration brief
            </Label>
            <textarea
              id="contribution-description"
              className={styles.textarea}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              placeholder="Describe the problem, the expected contribution, and any context new participants should know."
            />
          </Stack>
          <Stack gap="xs" className={styles.span4}>
            <Label htmlFor="contribution-type">Contribution type</Label>
            <select
              id="contribution-type"
              className={styles.select}
              aria-label="Contribution type"
              value={type}
              onChange={(event) => setType(event.currentTarget.value as ContributionType)}
            >
              {contributionTypes.map((value) => (
                <option key={value} value={value}>
                  {formatContributionLabel(value)}
                </option>
              ))}
            </select>
          </Stack>
          <Stack gap="xs" className={styles.span4}>
            <Label htmlFor="contribution-difficulty">Difficulty</Label>
            <select
              id="contribution-difficulty"
              className={styles.select}
              aria-label="Contribution difficulty"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.currentTarget.value as ContributionDifficulty)
              }
            >
              {contributionDifficulties.map((value) => (
                <option key={value} value={value}>
                  {formatContributionLabel(value)}
                </option>
              ))}
            </select>
          </Stack>
          <Stack gap="xs" className={styles.span4}>
            <Label>Why this matters</Label>
            <Text tone="muted">
              Clear requests reduce onboarding friction and make collaboration more confident for
              the next participant.
            </Text>
          </Stack>
        </div>

        <Stack direction="row" gap="sm" wrap>
          <Button
            onClick={() => void onCreateContribution()}
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            Publish Contribution
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setTitle("");
              setDescription("");
              setCreditOffer("50");
              setType("mentorship");
              setDifficulty("medium");
            }}
          >
            Reset Draft
          </Button>
        </Stack>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Browse contributions"
        title="Find work that needs attention"
        description="Search locally, refine by backend-supported filters, and understand the shape of the queue at a glance."
      >
        <div className={styles.toolbar}>
          <div className={styles.toolbarGrow}>
            <Label htmlFor="contribution-search">Search the current queue</Label>
            <Input
              id="contribution-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder="Search by title, description, id, type, or state"
            />
          </div>
          <div className={styles.toolbarCompact}>
            <Label htmlFor="contribution-state-filter">State</Label>
            <Input
              id="contribution-state-filter"
              aria-label="Filter by post state"
              placeholder="open"
              value={stateFilter}
              onChange={(event) => setStateFilter(event.currentTarget.value)}
            />
          </div>
          <div className={styles.toolbarCompact}>
            <Label htmlFor="contribution-type-filter">Type</Label>
            <Input
              id="contribution-type-filter"
              aria-label="Filter by contribution type"
              placeholder="mentorship"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.currentTarget.value)}
            />
          </div>
          <div className={styles.toolbarCompact}>
            <Label htmlFor="contribution-difficulty-filter">Difficulty</Label>
            <Input
              id="contribution-difficulty-filter"
              aria-label="Filter by difficulty"
              placeholder="medium"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.currentTarget.value)}
            />
          </div>
        </div>

        <Stack direction="row" gap="sm" wrap>
          {hasFilters ? (
            <Button variant="secondary" onClick={onResetFilters}>
              Clear Filters
            </Button>
          ) : null}
          {isRefreshing ? (
            <StatusBadge label="Refreshing workspace list" tone="warning" />
          ) : (
            <StatusBadge
              label={posts.length > 0 ? "Queue synchronized" : "Waiting for contributions"}
              tone={posts.length > 0 ? "success" : "default"}
            />
          )}
        </Stack>
      </WorkspacePanel>

      {errorMessage ? (
        <WorkspacePanel
          eyebrow="Needs attention"
          title="The contribution workspace could not finish a request"
          description={errorMessage}
          subtle
        >
          <StatusBadge label="Action needed" tone="danger" />
        </WorkspacePanel>
      ) : null}

      {statusMessage ? (
        <WorkspacePanel
          eyebrow="Workspace update"
          title="Contribution activity recorded"
          description={statusMessage}
          subtle
        >
          <StatusBadge label="Saved to workspace" tone="success" />
        </WorkspacePanel>
      ) : null}

      {isLoading ? (
        <WorkspacePanel
          eyebrow="Loading"
          title="Hydrating contribution queue"
          description="Pulling the latest contribution state and preserving the current architecture while the route settles."
          subtle
        >
          <StatusBadge label="Loading contributions" tone="warning" />
        </WorkspacePanel>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No contributions match the current view" : "No contributions yet"}
          description={
            hasFilters
              ? "Adjust the filters or search query to widen the queue again."
              : "Create the first contribution to give the workspace a concrete collaboration entry point."
          }
          actions={
            hasFilters ? (
              <Button variant="secondary" onClick={onResetFilters}>
                Reset Filters
              </Button>
            ) : (
              <StatusBadge label="Ready for first contribution" />
            )
          }
        />
      ) : (
        <div className={styles.cardList}>
          {filteredPosts.map((post) => (
            <ContributionCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {nextCursor ? (
        <Button variant="secondary" onClick={() => void onLoadMore()} loading={isLoadingMore}>
          Load More Results
        </Button>
      ) : null}
    </AppShell>
  );
}
