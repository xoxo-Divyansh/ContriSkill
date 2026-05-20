import type {
  CollaborativeMutationEnvelope,
  CollaborativeMutationResultEnvelope
} from "@contriskill/contracts";

import type { HttpClient } from "./types";

export type MutationClient = {
  submitMutation(
    input: { envelope: CollaborativeMutationEnvelope },
    accessToken?: string
  ): Promise<CollaborativeMutationResultEnvelope>;
};

const sessionHeader = (accessToken: string): HeadersInit => {
  return { "x-session-token": accessToken };
};

export const createMutationClient = (httpClient: HttpClient): MutationClient => {
  return {
    submitMutation: async (input, accessToken) => {
      const response = await httpClient.post<
        {
          result: CollaborativeMutationResultEnvelope;
        },
        CollaborativeMutationEnvelope
      >("/api/v1/mutations", {
        body: input.envelope,
        ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
      });

      return response.result;
    }
  };
};
