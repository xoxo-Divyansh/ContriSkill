"use client";

import { Text } from "@contriskill/ui";
import type { ReactNode } from "react";

import { WorkspacePanel } from "../../components/workspace/workspace-foundation";
import { RequireAuth } from "../../lib/routing/require-auth";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth
      fallback={
        <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1rem" }}>
          <WorkspacePanel
            eyebrow="Session required"
            title="Your session is no longer authorized"
            description="Sign in again to restore access to protected workspace routes."
          >
            <Text tone="muted">Redirecting to sign in.</Text>
          </WorkspacePanel>
        </main>
      }
    >
      {children}
    </RequireAuth>
  );
}
