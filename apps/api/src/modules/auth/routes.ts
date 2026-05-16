import { Router } from "express";

import type { ApiEnv } from "../../config/env";
import type { DatabaseClient } from "../../db/postgres";
import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireRoleMiddleware } from "../../middleware/require-role";

import { AuthController } from "./controller";
import { createAuthIdentityRepository } from "./identity";
import { createAuthService } from "./service";

export const createAuthRouter = (dependencies: {
  env: ApiEnv;
  sessionStore: Parameters<typeof createAuthService>[0]["sessionStore"];
  databaseClient?: DatabaseClient;
}) => {
  const authRouter = Router();
  const authController = new AuthController(
    createAuthService({
      sessionStore: dependencies.sessionStore,
      identityRepository: createAuthIdentityRepository(
        dependencies.env,
        dependencies.databaseClient ? { databaseClient: dependencies.databaseClient } : {}
      )
    })
  );

  authRouter.post("/auth/register", authController.register);
  authRouter.post("/auth/login", authController.login);
  authRouter.post(
    "/auth/refresh",
    requireAuthMiddleware,
    requireRoleMiddleware("user"),
    authController.refresh
  );
  authRouter.post(
    "/auth/logout",
    requireAuthMiddleware,
    requireRoleMiddleware("user"),
    authController.logout
  );
  authRouter.get("/auth/me", requireAuthMiddleware, authController.session);

  return authRouter;
};
