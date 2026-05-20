import { Router } from "express";

import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireCapabilityMiddleware } from "../../middleware/require-capability";

import { MutationController } from "./controller";
import { createMutationIntakeService } from "./service";

export const createMutationRouter = (): Router => {
  const router = Router();
  const service = createMutationIntakeService();
  const controller = new MutationController(service);

  router.post(
    "/mutations",
    requireAuthMiddleware,
    requireCapabilityMiddleware("mutation:submit"),
    controller.submit
  );

  return router;
};
