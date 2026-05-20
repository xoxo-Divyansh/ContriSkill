import type { Server as HttpServer } from "node:http";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import type { ApiEnv } from "./config/env";
import { createPostgresClient } from "./db/postgres";
import { createRequestActorMiddleware } from "./middleware/request-actor";
import { createAuthRouter } from "./modules/auth/routes";
import { createAuthSessionRuntime } from "./modules/auth/session";
import type { AuthSessionRuntime } from "./modules/auth/session";
import { createContributionRouter } from "./modules/contribution/routes";
import { createDraftSyncRouter } from "./modules/draft/routes";
import { createMutationRouter } from "./modules/mutation/routes";
import { log } from "./observability/logger";
import { setRealtimeBroadcaster } from "./realtime/broadcaster";
import { createRealtimeRuntime } from "./realtime/runtime";
import { createWsTransport } from "./realtime/ws-transport";
import { healthRouter } from "./routes/health";

const getCorsAllowedOrigins = (configuredOrigin: string): string[] => {
  const configuredUrl = new URL(configuredOrigin);
  const allowedOrigins = new Set<string>([configuredUrl.origin]);

  if (configuredUrl.hostname === "localhost") {
    const loopbackUrl = new URL(configuredUrl.toString());
    loopbackUrl.hostname = "127.0.0.1";
    allowedOrigins.add(loopbackUrl.origin);
  }

  if (configuredUrl.hostname === "127.0.0.1") {
    const localhostUrl = new URL(configuredUrl.toString());
    localhostUrl.hostname = "localhost";
    allowedOrigins.add(localhostUrl.origin);
  }

  return [...allowedOrigins];
};

export const createServer = (
  env: ApiEnv,
  dependencies: {
    databaseClientOverride?: ReturnType<typeof createPostgresClient>;
  } = {}
) => {
  return createServerRuntime(env, dependencies).app;
};

export const createServerRuntime = (
  env: ApiEnv,
  dependencies: {
    databaseClientOverride?: ReturnType<typeof createPostgresClient>;
    httpServer?: HttpServer;
  } = {}
): {
  app: express.Express;
  authSessionRuntime: AuthSessionRuntime;
  startRealtime: () => void;
  stopRealtime: () => void;
} => {
  const app = express();
  const corsAllowedOrigins = getCorsAllowedOrigins(env.wsCorsOrigin);
  const databaseClient = dependencies.databaseClientOverride ?? createPostgresClient(env);
  const authSessionRuntime = createAuthSessionRuntime(
    env,
    databaseClient ? { databaseClient } : {}
  );
  log("info", "Auth session runtime initialized.", {
    mode: authSessionRuntime.mode,
    hasDatabaseUrl: Boolean(env.databaseUrl)
  });

  app.use(helmet());
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || corsAllowedOrigins.includes(requestOrigin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${requestOrigin} is not allowed by CORS.`));
      }
    })
  );
  app.use(express.json());
  app.use(createRequestActorMiddleware(authSessionRuntime.sessionResolver));
  app.use("/api/v1", healthRouter);
  app.use(
    "/api/v1",
    createAuthRouter({
      env,
      sessionStore: authSessionRuntime.sessionStore,
      ...(databaseClient ? { databaseClient } : {})
    })
  );
  app.use(
    "/api/v1",
    createContributionRouter({
      env,
      ...(databaseClient ? { databaseClient } : {})
    })
  );
  app.use("/api/v1", createDraftSyncRouter());
  app.use("/api/v1", createMutationRouter());

  const realtimeRuntime =
    dependencies.httpServer &&
    createRealtimeRuntime({
      transport: createWsTransport(dependencies.httpServer, "/api/v1/realtime"),
      sessionResolver: authSessionRuntime.sessionResolver
    });

  if (realtimeRuntime) {
    setRealtimeBroadcaster(realtimeRuntime.broadcaster);
  }

  return {
    app,
    authSessionRuntime,
    startRealtime: () => {
      realtimeRuntime?.start();
    },
    stopRealtime: () => {
      realtimeRuntime?.stop();
    }
  };
};
