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
import { AuthIdentityRuntimeError, type AuthIdentityRepository } from "./identity";
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
  identityRepository: AuthIdentityRepository;
  passwordHasher: PasswordHasher;
};

class PlaceholderAuthService implements AuthService {
  constructor(private readonly dependencies: AuthServiceDependencies) {}

  async register(payload: RegisterRequestBody): Promise<RegisterResponse> {
    const passwordHash = await this.dependencies.passwordHasher.hash(payload.password);
    const identity = await this.dependencies.identityRepository.create({
      email: payload.email,
      username: payload.username,
      passwordHash,
      role: "user"
    });

    return {
      data: {
        status: placeholderStatus,
        user: {
          id: identity.id,
          email: identity.email,
          username: identity.username,
          role: identity.role,
          status: "placeholder"
        }
      }
    };
  }

  async login(payload: LoginRequestBody): Promise<LoginResponse> {
    const identity = await this.dependencies.identityRepository.findByIdentifier(
      payload.identifier
    );
    if (!identity) {
      throw new AuthIdentityRuntimeError("INVALID_CREDENTIALS", "Invalid identifier or password.");
    }

    const isValidPassword = await this.dependencies.passwordHasher.verify(
      payload.password,
      identity.passwordHash
    );
    if (!isValidPassword) {
      throw new AuthIdentityRuntimeError("INVALID_CREDENTIALS", "Invalid identifier or password.");
    }

    const session = await this.dependencies.sessionStore.create({
      userId: identity.id,
      role: identity.role
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

export const createAuthService = (dependencies: {
  sessionStore: SessionStore;
  identityRepository: AuthIdentityRepository;
}): AuthService => {
  return new PlaceholderAuthService({
    sessionStore: dependencies.sessionStore,
    identityRepository: dependencies.identityRepository,
    passwordHasher: createPasswordHasher()
  });
};
