import cors from "cors";
import express from "express";
import helmet from "helmet";

import type { ApiEnv } from "./config/env";
import { createPostgresClient } from "./db/postgres";
import { createRequestActorMiddleware } from "./middleware/request-actor";
import { createAuthRouter } from "./modules/auth/routes";
import { createAuthSessionRuntime } from "./modules/auth/session";
import { log } from "./observability/logger";
import { healthRouter } from "./routes/health";

export const createServer = (
  env: ApiEnv,
  dependencies: {
    databaseClientOverride?: ReturnType<typeof createPostgresClient>;
  } = {}
) => {
  const app = express();
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
      origin: env.wsCorsOrigin
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

  return app;
};
