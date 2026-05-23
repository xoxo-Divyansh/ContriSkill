"use client";

import { Button, Stack, Text } from "@contriskill/ui";
import { useRouter } from "next/navigation";
import React from "react";

import { WorkspacePanel } from "../../../components/workspace/workspace-foundation";

type WorkspaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkspaceError({ reset }: WorkspaceErrorProps) {
  const router = useRouter();

  return (
    <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <WorkspacePanel
        eyebrow="Workspace unavailable"
        title="We could not load the protected workspace"
        description="This protected route failed to render. Try again, go back, or return to the contribution queue."
      >
        <Stack direction="row" gap="sm" wrap>
          <Button onClick={() => reset()}>Retry Workspace</Button>
          <Button variant="secondary" onClick={() => router.push("/app/contributions")}>
            Go to Contributions
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>
        <Text variant="caption" tone="muted">
          Internal diagnostics are hidden in production to protect system details.
        </Text>
      </WorkspacePanel>
    </main>
  );
}
