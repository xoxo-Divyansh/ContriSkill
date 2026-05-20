"use client";

import { Card, CardBody, CardHeader, Stack, Text } from "@contriskill/ui";
import Link from "next/link";

import type { ContributionPost } from "../../../../../lib/api/contribution-client";

export type ContributionCardProps = {
  post: ContributionPost;
};

export const ContributionCard = ({ post }: ContributionCardProps) => {
  return (
    <Card variant="subtle">
      <CardHeader>
        <Text variant="subtitle">
          <Link href={`/app/contributions/${post.id}`}>{post.title}</Link>
        </Text>
      </CardHeader>
      <CardBody>
        <Stack gap="xs">
          <Text tone="muted">{post.description}</Text>
          <Text variant="caption">
            {post.type} • {post.difficulty} • {post.state}
          </Text>
          <Text variant="caption">Credits: {post.creditOffer}</Text>
        </Stack>
      </CardBody>
    </Card>
  );
};
