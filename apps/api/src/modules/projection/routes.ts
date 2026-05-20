import { Router } from "express";

import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireCapabilityMiddleware } from "../../middleware/require-capability";

import { ProjectionSyncController } from "./controller";
import { createProjectionSyncService } from "./service";

export const createProjectionSyncRouter = (): Router => {
  const router = Router();
  const service = createProjectionSyncService();
  const controller = new ProjectionSyncController(service);

  router.get(
    "/projections/:projectionId",
    requireAuthMiddleware,
    requireCapabilityMiddleware("projection:sync"),
    controller.getSnapshot
  );
  router.post(
    "/projections/sync",
    requireAuthMiddleware,
    requireCapabilityMiddleware("projection:sync"),
    controller.syncUpdate
  );

  return router;
};
