import type { HttpClient } from "./types";

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type RefreshInput = {
  refreshToken?: string;
};

export type AuthActorSnapshot = {
  actorType: "anonymous" | "authenticated";
  role: "public" | "user" | "participant" | "owner" | "moderator" | "admin";
  sessionState: "anonymous" | "authenticated" | "expired";
};

export type RegisterOutput = {
  status: "OPEN_DECISION_IMPLEMENTATION_PENDING";
  user: {
    id: string;
    email: string;
    username: string;
    role: AuthActorSnapshot["role"];
    status: "placeholder";
  };
};

export type LoginOutput = {
  status: "OPEN_DECISION_IMPLEMENTATION_PENDING";
  session: {
    actor: AuthActorSnapshot;
    accessTokenIssued: false;
    refreshTokenIssued: false;
  };
};

export type RefreshOutput = LoginOutput;

export type LogoutOutput = {
  status: "OPEN_DECISION_IMPLEMENTATION_PENDING";
  revoked: false;
};

export type SessionOutput = {
  actor: AuthActorSnapshot & {
    userId?: string;
  };
};

export type AuthClient = {
  register(input: RegisterInput): Promise<RegisterOutput>;
  login(input: LoginInput): Promise<LoginOutput>;
  refresh(input?: RefreshInput): Promise<RefreshOutput>;
  logout(): Promise<LogoutOutput>;
  getSession(): Promise<SessionOutput>;
};

export const createAuthClient = (httpClient: HttpClient): AuthClient => {
  return {
    register: async (input) =>
      httpClient.post<RegisterOutput, RegisterInput>("/api/v1/auth/register", { body: input }),
    login: async (input) =>
      httpClient.post<LoginOutput, LoginInput>("/api/v1/auth/login", { body: input }),
    refresh: async (input = {}) =>
      httpClient.post<RefreshOutput, RefreshInput>("/api/v1/auth/refresh", { body: input }),
    logout: async () => httpClient.post<LogoutOutput>("/api/v1/auth/logout"),
    getSession: async () => httpClient.get<SessionOutput>("/api/v1/auth/me")
  };
};
