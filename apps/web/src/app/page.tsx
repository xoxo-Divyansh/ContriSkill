"use client";

import { resolveRootRouteTarget } from "../lib/routing/route-policy";
import { useSession } from "../providers/session-provider";

export default function RootRoutePage() {
  const { session } = useSession();
  const targetPath = resolveRootRouteTarget(session);

  return (
    <main>
      <h1>Root Route Strategy Shell</h1>
      <p data-route-intent={`redirect:${targetPath}`}>
        OPEN_DECISION_ROOT_REDIRECT_TARGET:{targetPath}
      </p>
    </main>
  );
}
