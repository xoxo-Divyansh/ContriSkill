import type { Request, Response } from "express";

import { resolveAccessTokenFromRequest } from "../../middleware/request-actor";

import { AuthIdentityRuntimeError } from "./identity";
import type { AuthService } from "./service";
import type { RequestWithActor } from "./types";

type ApiErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_ERROR" | "STATE_CONFLICT";

const httpStatus = {
  accepted: 202,
  ok: 200,
  unauthorized: 401,
  forbidden: 403,
  badRequest: 400,
  conflict: 409
} as const;

const sendError = (
  response: Response,
  status: (typeof httpStatus)[keyof typeof httpStatus],
  code: ApiErrorCode,
  message: string
): void => {
  response.status(status).json({
    error: {
      code,
      message
    }
  });
};

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (request: Request, response: Response): Promise<void> => {
    const { email, password, username } = request.body as Partial<{
      email: string;
      password: string;
      username: string;
    }>;

    if (!email || !password || !username) {
      sendError(
        response,
        httpStatus.badRequest,
        "VALIDATION_ERROR",
        "email, username, and password are required."
      );
      return;
    }

    try {
      const payload = await this.service.register({ email, password, username });
      response.status(httpStatus.accepted).json(payload);
    } catch (error) {
      if (error instanceof AuthIdentityRuntimeError && error.code === "IDENTITY_ALREADY_EXISTS") {
        sendError(response, httpStatus.conflict, "STATE_CONFLICT", error.message);
        return;
      }
      throw error;
    }
  };

  login = async (request: Request, response: Response): Promise<void> => {
    const { identifier, password } = request.body as Partial<{
      identifier: string;
      password: string;
    }>;

    if (!identifier || !password) {
      sendError(
        response,
        httpStatus.badRequest,
        "VALIDATION_ERROR",
        "identifier and password are required."
      );
      return;
    }

    try {
      const payload = await this.service.login({ identifier, password });
      response.status(httpStatus.accepted).json(payload);
    } catch (error) {
      if (error instanceof AuthIdentityRuntimeError && error.code === "INVALID_CREDENTIALS") {
        sendError(response, httpStatus.unauthorized, "UNAUTHENTICATED", error.message);
        return;
      }
      throw error;
    }
  };

  refresh = async (request: RequestWithActor, response: Response): Promise<void> => {
    if (!request.actor) {
      sendError(
        response,
        httpStatus.unauthorized,
        "UNAUTHENTICATED",
        "Authentication is required."
      );
      return;
    }

    const refreshToken =
      typeof request.body?.refreshToken === "string" ? request.body.refreshToken : undefined;
    const payload = await this.service.refresh({ refreshToken }, request.actor);
    response.status(httpStatus.accepted).json(payload);
  };

  logout = async (request: RequestWithActor, response: Response): Promise<void> => {
    if (!request.actor) {
      sendError(
        response,
        httpStatus.unauthorized,
        "UNAUTHENTICATED",
        "Authentication is required."
      );
      return;
    }

    const payload = await this.service.logout(
      request.actor,
      resolveAccessTokenFromRequest(request)
    );
    response.status(httpStatus.ok).json(payload);
  };

  session = async (request: RequestWithActor, response: Response): Promise<void> => {
    if (!request.actor) {
      sendError(
        response,
        httpStatus.unauthorized,
        "UNAUTHENTICATED",
        "Authentication is required."
      );
      return;
    }

    const payload = await this.service.getSession(request.actor);
    response.status(httpStatus.ok).json(payload);
  };
}
