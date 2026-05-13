import cors from "cors";
import express from "express";
import helmet from "helmet";

import type { ApiEnv } from "./config/env";
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
  app.use("/api/v1", healthRouter);

  return app;
};
