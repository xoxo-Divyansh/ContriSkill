import cors from "cors";
import express from "express";
import helmet from "helmet";

import type { ApiEnv } from "./config/env";
import { requestActorMiddleware } from "./middleware/request-actor";
import { authRouter } from "./modules/auth/routes";
import { healthRouter } from "./routes/health";

export const createServer = (env: ApiEnv) => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.wsCorsOrigin
    })
  );
  app.use(express.json());
  app.use(requestActorMiddleware);
  app.use("/api/v1", healthRouter);
  app.use("/api/v1", authRouter);

  return app;
};
