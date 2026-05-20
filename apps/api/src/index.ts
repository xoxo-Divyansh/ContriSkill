import { createServer as createHttpServer } from "node:http";

import dotenv from "dotenv";

import { getApiEnv } from "./config/env";
import { createServerRuntime } from "./server";

dotenv.config();

const apiEnv = getApiEnv();
const httpServer = createHttpServer();
const runtime = createServerRuntime(apiEnv, { httpServer });

httpServer.on("request", runtime.app);
runtime.startRealtime();

httpServer.listen(apiEnv.port, () => {
  console.log(`API foundation server listening on ${apiEnv.port}`);
});
