"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { resolveRootRouteTarget } from "../lib/routing/route-policy";
import { useSession } from "../providers/session-provider";

export default function RootRoutePage() {
  const { session } = useSession();
  const router = useRouter();
  const targetPath = resolveRootRouteTarget(session);

  useEffect(() => {
    router.replace(targetPath);
  }, [router, targetPath]);

  return (
    <main>
      <p data-route-intent={`redirect:${targetPath}`}>Redirecting...</p>
    </main>
  );
}
