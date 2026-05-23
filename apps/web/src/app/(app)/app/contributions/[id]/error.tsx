"use client";

import { Button, Stack } from "@contriskill/ui";
import { useRouter } from "next/navigation";
import React from "react";

import { WorkspacePanel } from "../../../../../components/workspace/workspace-foundation";

type ContributionDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ContributionDetailError({ reset }: ContributionDetailErrorProps) {
  const router = useRouter();

  return (
    <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <WorkspacePanel
        eyebrow="Contribution detail unavailable"
        title="This contribution workspace failed to load"
        description="Try loading this contribution again or return to the contribution list."
      >
        <Stack direction="row" gap="sm" wrap>
          <Button onClick={() => reset()}>Retry Detail</Button>
          <Button variant="secondary" onClick={() => router.push("/app/contributions")}>
            Back to Contributions
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>
      </WorkspacePanel>
    </main>
  );
}
