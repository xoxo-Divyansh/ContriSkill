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
    sessionId?: string;
    sessionExpiresAt?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenIssued: boolean;
    refreshTokenIssued: boolean;
  };
};

export type RefreshOutput = LoginOutput;

export type LogoutOutput = {
  status: "OPEN_DECISION_IMPLEMENTATION_PENDING";
  revoked: boolean;
};

export type SessionOutput = {
  actor: AuthActorSnapshot & {
    userId?: string;
  };
};

export type AuthClient = {
  register(input: RegisterInput): Promise<RegisterOutput>;
  login(input: LoginInput): Promise<LoginOutput>;
  refresh(input?: RefreshInput & { accessToken?: string }): Promise<RefreshOutput>;
  logout(input?: { accessToken?: string }): Promise<LogoutOutput>;
  getSession(input?: { accessToken?: string }): Promise<SessionOutput>;
};

export const createAuthClient = (httpClient: HttpClient): AuthClient => {
  const withSessionHeader = (accessToken: string): HeadersInit => {
    return { "x-session-token": accessToken };
  };

  return {
    register: async (input) =>
      httpClient.post<RegisterOutput, RegisterInput>("/api/v1/auth/register", { body: input }),
    login: async (input) =>
      httpClient.post<LoginOutput, LoginInput>("/api/v1/auth/login", { body: input }),
    refresh: async (input = {}) =>
      httpClient.post<RefreshOutput, RefreshInput>("/api/v1/auth/refresh", {
        body: {
          ...(input.refreshToken ? { refreshToken: input.refreshToken } : {})
        },
        ...(input.accessToken ? { headers: withSessionHeader(input.accessToken) } : {})
      }),
    logout: async (input = {}) =>
      httpClient.post<LogoutOutput>("/api/v1/auth/logout", {
        ...(input.accessToken ? { headers: withSessionHeader(input.accessToken) } : {})
      }),
    getSession: async (input = {}) =>
      httpClient.get<SessionOutput>("/api/v1/auth/me", {
        ...(input.accessToken ? { headers: withSessionHeader(input.accessToken) } : {})
      })
  };
};
