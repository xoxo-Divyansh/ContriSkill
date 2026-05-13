import type { Role, SessionState } from "@contriskill/domain";

export type SessionActorType = "anonymous" | "authenticated";

export type SessionSnapshot = {
  actorType: SessionActorType;
  role: Role;
  sessionState: SessionState;
  userId: string | undefined;
};

export type SessionContextValue = {
  session: SessionSnapshot;
  isAuthenticated: boolean;
  setSession: (nextSession: SessionSnapshot) => void;
  clearSession: () => void;
};

export const anonymousSession: SessionSnapshot = {
  actorType: "anonymous",
  role: "public",
  sessionState: "anonymous",
  userId: undefined
};
