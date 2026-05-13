import dotenv from "dotenv";

import { getApiEnv } from "./config/env";
import { createServer } from "./server";

dotenv.config();

const apiEnv = getApiEnv();
const app = createServer(apiEnv);

app.listen(apiEnv.port, () => {
  console.log(`API foundation server listening on ${apiEnv.port}`);
});
