import type { AuthRole, RequestActor } from "./types";

export type AuthPlaceholderStatus = "OPEN_DECISION_IMPLEMENTATION_PENDING";

export type RegisterRequestBody = {
  email: string;
  username: string;
  password: string;
};

export type LoginRequestBody = {
  identifier: string;
  password: string;
};

export type RefreshRequestBody = {
  refreshToken?: string;
};

export type PlaceholderAuthSession = {
  sessionId?: string;
  actor: Pick<RequestActor, "actorType" | "role" | "sessionState">;
  sessionExpiresAt?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenIssued: boolean;
  refreshTokenIssued: boolean;
};

export type PlaceholderAuthUser = {
  id: string;
  email: string;
  username: string;
  role: AuthRole;
  status: "placeholder";
};

type ApiSuccessEnvelope<TData> = {
  data: TData;
};

type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string | number | boolean>;
  };
};

export type RegisterResponse = ApiSuccessEnvelope<{
  status: AuthPlaceholderStatus;
  user: PlaceholderAuthUser;
}>;

export type LoginResponse = ApiSuccessEnvelope<{
  status: AuthPlaceholderStatus;
  session: PlaceholderAuthSession;
}>;

export type RefreshResponse = ApiSuccessEnvelope<{
  status: AuthPlaceholderStatus;
  session: PlaceholderAuthSession;
}>;

export type LogoutResponse = ApiSuccessEnvelope<{
  status: AuthPlaceholderStatus;
  revoked: boolean;
}>;

export type SessionResponse = ApiSuccessEnvelope<{
  actor: RequestActor;
}>;

export type AuthErrorResponse = ApiErrorEnvelope;
