import { Router } from "express";

import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireRoleMiddleware } from "../../middleware/require-role";

import { AuthController } from "./controller";
import { createAuthService } from "./service";

const authRouter = Router();

const authController = new AuthController(createAuthService());

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

export { authRouter };
