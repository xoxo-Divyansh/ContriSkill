"use client";

import { Button, Stack, Text } from "@contriskill/ui";
import React from "react";

import { WorkspacePanel } from "../components/workspace/workspace-foundation";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ reset }: RootErrorProps) {
  return (
    <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <WorkspacePanel
        eyebrow="Unexpected error"
        title="ContriSkill hit a runtime problem"
        description="A temporary issue interrupted this page. Your data is safe. Try again or reload."
      >
        <Stack direction="row" gap="sm" wrap>
          <Button onClick={() => reset()}>Try Again</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Stack>
        <Text variant="caption" tone="muted">
          If this keeps happening, return to the previous page and retry.
        </Text>
      </WorkspacePanel>
    </main>
  );
}
