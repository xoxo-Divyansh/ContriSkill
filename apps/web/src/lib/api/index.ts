import { getWebEnv } from "../../env";

import { createAuthClient } from "./auth-client";
import { createContributionClient } from "./contribution-client";
import { createHttpClient } from "./http-client";
import { createUserClient } from "./user-client";

export * from "./auth-client";
export * from "./contribution-client";
export * from "./error-normalizer";
export * from "./http-client";
export * from "./types";
export * from "./user-client";

const webEnv = getWebEnv();

export const apiHttpClient = createHttpClient({
  baseUrl: webEnv.apiBaseUrl,
  defaultHeaders: {
    accept: "application/json"
  }
});

export const authClient = createAuthClient(apiHttpClient);
export const contributionClient = createContributionClient(apiHttpClient);
export const userClient = createUserClient(apiHttpClient);
