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
import { createPasswordHasher, type PasswordHasher } from "./password-hasher";
import { type SessionStore } from "./session";
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
  logout(actor: RequestActor, accessToken: string | undefined): Promise<LogoutResponse>;
  getSession(actor: RequestActor): Promise<SessionResponse>;
};

type AuthServiceDependencies = {
  sessionStore: SessionStore;
  passwordHasher: PasswordHasher;
};

class PlaceholderAuthService implements AuthService {
  constructor(private readonly dependencies: AuthServiceDependencies) {}

  async register(payload: RegisterRequestBody): Promise<RegisterResponse> {
    await this.dependencies.passwordHasher.hash(payload.password);

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
    await this.dependencies.passwordHasher.verify(
      payload.password,
      `OPEN_DECISION_HASH_${payload.password.length}`
    );

    const session = await this.dependencies.sessionStore.create({
      userId: "OPEN_DECISION_user_id",
      role: "user"
    });

    return {
      data: {
        status: placeholderStatus,
        session: {
          actor: {
            actorType: "authenticated",
            role: session.role,
            sessionState: "authenticated"
          },
          sessionId: session.id,
          sessionExpiresAt: session.expiresAt,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          accessTokenIssued: true,
          refreshTokenIssued: true
        }
      }
    };
  }

  async refresh(payload: RefreshRequestBody, actor: RequestActor): Promise<RefreshResponse> {
    const refreshToken = payload.refreshToken;
    const rotatedSession = refreshToken
      ? await this.dependencies.sessionStore.rotateByRefreshToken(refreshToken)
      : undefined;

    if (rotatedSession) {
      return {
        data: {
          status: placeholderStatus,
          session: {
            actor: {
              actorType: "authenticated",
              role: rotatedSession.role,
              sessionState: "authenticated"
            },
            sessionId: rotatedSession.id,
            sessionExpiresAt: rotatedSession.expiresAt,
            accessToken: rotatedSession.accessToken,
            refreshToken: rotatedSession.refreshToken,
            accessTokenIssued: true,
            refreshTokenIssued: true
          }
        }
      };
    }

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

  async logout(actor: RequestActor, accessToken: string | undefined): Promise<LogoutResponse> {
    void actor;

    const revoked = accessToken
      ? await this.dependencies.sessionStore.revokeByAccessToken(accessToken)
      : false;

    return {
      data: {
        status: placeholderStatus,
        revoked
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

export const createAuthService = (dependencies: { sessionStore: SessionStore }): AuthService => {
  return new PlaceholderAuthService({
    sessionStore: dependencies.sessionStore,
    passwordHasher: createPasswordHasher()
  });
};
