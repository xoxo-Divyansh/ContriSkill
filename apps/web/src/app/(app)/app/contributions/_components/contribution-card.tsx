"use client";

import { Text } from "@contriskill/ui";
import Link from "next/link";

import {
  StatusBadge,
  WorkspacePanel
} from "../../../../../components/workspace/workspace-foundation";
import styles from "../../../../../components/workspace/workspace-foundation.module.css";
import type { ContributionPost } from "../../../../../lib/api/contribution-client";

export type ContributionCardProps = {
  post: ContributionPost;
};

const formatContributionLabel = (value: string) => {
  return value
    .split("_")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
};

const formatCreatedAt = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently created";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const resolveStateTone = (state: ContributionPost["state"]) => {
  if (state === "open") {
    return "success" as const;
  }

  if (state === "in_review" || state === "in_progress") {
    return "warning" as const;
  }

  if (state === "cancelled" || state === "disputed" || state === "expired") {
    return "danger" as const;
  }

  return "default" as const;
};

export const ContributionCard = ({ post }: ContributionCardProps) => {
  return (
    <WorkspacePanel
      eyebrow="Contribution"
      title={post.title}
      description={post.description}
      actions={
        <StatusBadge
          label={formatContributionLabel(post.state)}
          tone={resolveStateTone(post.state)}
        />
      }
      footer={
        <>
          <Text variant="caption" tone="muted">
            Created {formatCreatedAt(post.createdAt)}
          </Text>
          <Link href={`/app/contributions/${post.id}`} className={styles.linkButton}>
            <Text variant="label">Open workspace</Text>
          </Link>
        </>
      }
    >
      <div className={styles.keyValueList}>
        <div className={styles.keyValueItem}>
          <Text variant="label">Contribution type</Text>
          <Text tone="muted">{formatContributionLabel(post.type)}</Text>
        </div>
        <div className={styles.keyValueItem}>
          <Text variant="label">Difficulty</Text>
          <Text tone="muted">{formatContributionLabel(post.difficulty)}</Text>
        </div>
        <div className={styles.keyValueItem}>
          <Text variant="label">Credit offer</Text>
          <Text tone="muted">{post.creditOffer} credits</Text>
        </div>
        <div className={styles.keyValueItem}>
          <Text variant="label">Workspace id</Text>
          <Text tone="muted">{post.id}</Text>
        </div>
      </div>
    </WorkspacePanel>
  );
};
