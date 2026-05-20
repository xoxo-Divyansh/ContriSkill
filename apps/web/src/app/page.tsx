"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { resolveRootRouteTarget } from "../lib/routing/route-policy";
import { useSession } from "../providers/session-provider";

export default function RootRoutePage() {
  const { session, isReady } = useSession();
  const router = useRouter();
  const targetPath = resolveRootRouteTarget(session);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    router.replace(targetPath);
  }, [isReady, router, targetPath]);

  if (!isReady) {
    return (
      <main>
        <p data-route-intent="loading:session">Restoring session...</p>
      </main>
    );
  }

  return (
    <main>
      <p data-route-intent={`redirect:${targetPath}`}>Redirecting...</p>
    </main>
  );
}
