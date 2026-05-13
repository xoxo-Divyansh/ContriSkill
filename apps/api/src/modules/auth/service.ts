import type {
  LoginRequestBody,
  LoginResponse,
  LogoutResponse,
  RefreshRequestBody,
  RefreshResponse,
  RegisterRequestBody,
  RegisterResponse,
  SessionResponse
} from "./contracts";
import type { RequestActor } from "./types";

const placeholderStatus = "OPEN_DECISION_IMPLEMENTATION_PENDING" as const;

const getActorSnapshot = (actor: RequestActor) => {
  return {
    actorType: actor.actorType,
    role: actor.role,
    sessionState: actor.sessionState
  };
};

export type AuthService = {
  register(payload: RegisterRequestBody): Promise<RegisterResponse>;
  login(payload: LoginRequestBody): Promise<LoginResponse>;
  refresh(payload: RefreshRequestBody, actor: RequestActor): Promise<RefreshResponse>;
  logout(actor: RequestActor): Promise<LogoutResponse>;
  getSession(actor: RequestActor): Promise<SessionResponse>;
};

class PlaceholderAuthService implements AuthService {
  async register(payload: RegisterRequestBody): Promise<RegisterResponse> {
    return {
      data: {
        status: placeholderStatus,
        user: {
          id: "OPEN_DECISION_user_id",
          email: payload.email,
          username: payload.username,
          role: "user",
          status: "placeholder"
        }
      }
    };
  }

  async login(payload: LoginRequestBody): Promise<LoginResponse> {
    void payload;

    return {
      data: {
        status: placeholderStatus,
        session: {
          actor: {
            actorType: "anonymous",
            role: "public",
            sessionState: "anonymous"
          },
          accessTokenIssued: false,
          refreshTokenIssued: false
        }
      }
    };
  }

  async refresh(payload: RefreshRequestBody, actor: RequestActor): Promise<RefreshResponse> {
    void payload;

    return {
      data: {
        status: placeholderStatus,
        session: {
          actor: getActorSnapshot(actor),
          accessTokenIssued: false,
          refreshTokenIssued: false
        }
      }
    };
  }

  async logout(actor: RequestActor): Promise<LogoutResponse> {
    void actor;

    return {
      data: {
        status: placeholderStatus,
        revoked: false
      }
    };
  }

  async getSession(actor: RequestActor): Promise<SessionResponse> {
    return {
      data: {
        actor
      }
    };
  }
}

export const createAuthService = (): AuthService => {
  return new PlaceholderAuthService();
};
