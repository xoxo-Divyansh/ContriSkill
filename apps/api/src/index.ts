import { createServer as createHttpServer } from "node:http";

import dotenv from "dotenv";

import { describeApiEnvStartup, getApiEnv } from "./config/env";
import { log } from "./observability/logger";
import { createServerRuntime } from "./server";

dotenv.config();

const apiEnv = getApiEnv();
const startupDiagnostics = describeApiEnvStartup();
const httpServer = createHttpServer();
const runtime = createServerRuntime(apiEnv, { httpServer });

httpServer.on("request", runtime.app);
runtime.startRealtime();

httpServer.listen(apiEnv.port, () => {
  log("info", "API foundation server startup configuration validated.", startupDiagnostics);
  if (apiEnv.nodeEnv !== "production") {
    log("info", "API running in local/development-friendly mode.", {
      nodeEnv: apiEnv.nodeEnv,
      note: "Secrets are never printed. Use apps/api/.env.example for required keys."
    });
  }
  log("info", "API foundation server listening.", { port: apiEnv.port });
});
