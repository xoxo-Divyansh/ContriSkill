import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RedirectIfAuth } from "../src/lib/routing/redirect-if-auth";
import { RequireAuth } from "../src/lib/routing/require-auth";
import { RequireRole } from "../src/lib/routing/require-role";
import { resolveRootRouteTarget } from "../src/lib/routing/route-policy";
import { AppProviders } from "../src/providers/app-providers";
import type { SessionSnapshot } from "../src/types/session";

const renderWithSession = (session: SessionSnapshot, node: ReactElement): string => {
  return renderToStaticMarkup(
    createElement(
      AppProviders,
      {
        env: {
          appName: "ContriSkill Test",
          apiBaseUrl: "http://localhost:4000/"
        },
        session
      },
      node
    )
  );
};

describe("routing wrappers", () => {
  const anonymousSession: SessionSnapshot = {
    actorType: "anonymous",
    role: "public",
    sessionState: "anonymous",
    userId: undefined
  };

  const authenticatedUserSession: SessionSnapshot = {
    actorType: "authenticated",
    role: "user",
    sessionState: "authenticated",
    userId: "usr_100"
  };

  it("blocks RequireAuth for anonymous sessions", () => {
    const html = renderWithSession(
      anonymousSession,
      createElement(RequireAuth, null, createElement("p", null, "allowed"))
    );

    expect(html).toContain("OPEN_DECISION_ROUTE_GUARD_REQUIRE_AUTH");
    expect(html).toContain("redirect:/sign-in");
  });

  it("allows RequireAuth for authenticated sessions", () => {
    const html = renderWithSession(
      authenticatedUserSession,
      createElement(RequireAuth, null, createElement("p", null, "allowed"))
    );

    expect(html).toContain("allowed");
  });

  it("redirects already-authenticated users in RedirectIfAuth", () => {
    const html = renderWithSession(
      authenticatedUserSession,
      createElement(RedirectIfAuth, null, createElement("p", null, "sign-in-form"))
    );

    expect(html).toContain("OPEN_DECISION_ROUTE_GUARD_REDIRECT_IF_AUTH");
    expect(html).toContain("redirect:/app");
  });

  it("enforces role minimum in RequireRole", () => {
    const html = renderWithSession(
      authenticatedUserSession,
      createElement(
        RequireRole,
        { minimumRole: "moderator" },
        createElement("p", null, "moderator-area")
      )
    );

    expect(html).toContain("OPEN_DECISION_ROUTE_GUARD_REQUIRE_ROLE:moderator");
  });

  it("resolves root target path by session auth state", () => {
    expect(resolveRootRouteTarget(anonymousSession)).toBe("/home");
    expect(resolveRootRouteTarget(authenticatedUserSession)).toBe("/app");
  });
});
