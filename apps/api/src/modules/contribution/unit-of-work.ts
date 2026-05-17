import type { DatabaseClient } from "../../db/postgres";

import type { ContributionUnitOfWork } from "./types";

export const createContributionUnitOfWork = (
  databaseClient?: DatabaseClient
): ContributionUnitOfWork | undefined => {
  if (!databaseClient?.transaction) {
    return undefined;
  }

  return {
    run: async <T>(work: () => Promise<T>): Promise<T> => {
      return databaseClient.transaction!(async () => work());
    }
  };
};
