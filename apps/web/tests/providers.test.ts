import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { AuthClient } from "../src/lib/api/auth-client";
import type { HttpClient } from "../src/lib/api/types";
import type { UserClient } from "../src/lib/api/user-client";
import { useApiClient, type ApiClientProviderValue } from "../src/providers/api-client-provider";
import { AppProviders } from "../src/providers/app-providers";
import { useEnv } from "../src/providers/env-provider";
import { useSession } from "../src/providers/session-provider";
import type { SessionSnapshot } from "../src/types/session";

const createStubHttpClient = (): HttpClient => {
  return {
    request: async <TData>() => Promise.resolve({} as TData),
    get: async <TData>() => Promise.resolve({} as TData),
    post: async <TData>() => Promise.resolve({} as TData),
    patch: async <TData>() => Promise.resolve({} as TData),
    del: async <TData>() => Promise.resolve({} as TData)
  };
};

const createStubAuthClient = (): AuthClient => {
  return {
    register: async () =>
      Promise.resolve({
        status: "OPEN_DECISION_IMPLEMENTATION_PENDING",
        user: {
          id: "usr_placeholder",
          email: "placeholder@example.com",
          username: "placeholder",
          role: "user",
          status: "placeholder"
        }
      }),
    login: async () =>
      Promise.resolve({
        status: "OPEN_DECISION_IMPLEMENTATION_PENDING",
        session: {
          actor: {
            actorType: "authenticated",
            role: "user",
            sessionState: "authenticated"
          },
          accessTokenIssued: false,
          refreshTokenIssued: false
        }
      }),
    refresh: async () =>
      Promise.resolve({
        status: "OPEN_DECISION_IMPLEMENTATION_PENDING",
        session: {
          actor: {
            actorType: "authenticated",
            role: "user",
            sessionState: "authenticated"
          },
          accessTokenIssued: false,
          refreshTokenIssued: false
        }
      }),
    logout: async () =>
      Promise.resolve({
        status: "OPEN_DECISION_IMPLEMENTATION_PENDING",
        revoked: false
      }),
    getSession: async () =>
      Promise.resolve({
        actor: {
          actorType: "authenticated",
          role: "user",
          sessionState: "authenticated",
          userId: "usr_placeholder"
        }
      })
  };
};

const createStubUserClient = (): UserClient => {
  return {
    getPublicProfile: async () =>
      Promise.resolve({
        id: "usr_placeholder",
        username: "placeholder"
      }),
    updateMyProfile: async () =>
      Promise.resolve({
        profile: {
          id: "usr_placeholder",
          username: "placeholder"
        }
      }),
    getMyReputation: async () =>
      Promise.resolve({
        snapshot: {
          score: 0,
          completionRate: 0,
          reviewQualityScore: 0
        },
        recentEvents: []
      })
  };
};

const createStubApiClients = (): ApiClientProviderValue => {
  return {
    httpClient: createStubHttpClient(),
    authClient: createStubAuthClient(),
    userClient: createStubUserClient()
  };
};

describe("app providers", () => {
  it("wires env, session, and API providers together", () => {
    const session: SessionSnapshot = {
      actorType: "authenticated",
      role: "user",
      sessionState: "authenticated",
      userId: "usr_42"
    };

    const Probe = () => {
      const env = useEnv();
      const sessionContext = useSession();
      const apiClients = useApiClient();

      return createElement(
        "div",
        null,
        `${env.appName}|${sessionContext.isAuthenticated}|${sessionContext.session.userId}|${typeof apiClients.authClient.login}`
      );
    };

    const html = renderToStaticMarkup(
      createElement(
        AppProviders,
        {
          env: {
            appName: "ContriSkill Test",
            apiBaseUrl: "http://localhost:4000/"
          },
          session,
          apiClients: createStubApiClients()
        },
        createElement(Probe)
      )
    );

    expect(html).toContain("ContriSkill Test|true|usr_42|function");
  });

  it("throws when useSession is called outside provider hierarchy", () => {
    const SessionProbe = () => {
      useSession();
      return createElement("span", null, "ok");
    };

    expect(() => renderToStaticMarkup(createElement(SessionProbe))).toThrow(
      "useSession must be used within SessionProvider."
    );
  });
});
