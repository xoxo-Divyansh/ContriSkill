import cors from "cors";
import express from "express";
import helmet from "helmet";

import type { ApiEnv } from "./config/env";
import { createRequestActorMiddleware } from "./middleware/request-actor";
import { createAuthRouter } from "./modules/auth/routes";
import { createAuthSessionRuntime } from "./modules/auth/session";
import { healthRouter } from "./routes/health";

export const createServer = (env: ApiEnv) => {
  const app = express();
  const authSessionRuntime = createAuthSessionRuntime(env);

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
      sessionStore: authSessionRuntime.sessionStore
    })
  );

  return app;
};
