import type { SessionSnapshot } from "../../types/session";
import type { SessionOutput } from "../api/auth-client";

export const toSessionSnapshot = (
  session: SessionOutput["actor"],
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  }
): SessionSnapshot => {
  return {
    actorType: session.actorType,
    role: session.role,
    sessionState: session.sessionState,
    userId: session.userId,
    ...(tokens?.accessToken ? { accessToken: tokens.accessToken } : {}),
    ...(tokens?.refreshToken ? { refreshToken: tokens.refreshToken } : {})
  };
};
