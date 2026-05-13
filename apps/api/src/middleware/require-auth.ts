import type { NextFunction, Request, Response } from "express";

export const requireAuthMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const actor = request.actor;

  if (
    actor?.actorType === "authenticated" &&
    actor.sessionState === "authenticated" &&
    actor.userId
  ) {
    next();
    return;
  }

  response.status(401).json({
    error: {
      code: "UNAUTHENTICATED",
      message: "Authentication is required for this endpoint."
    }
  });
};
