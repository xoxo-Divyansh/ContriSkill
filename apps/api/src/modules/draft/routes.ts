import { Router } from "express";

import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireCapabilityMiddleware } from "../../middleware/require-capability";

import { DraftSyncController } from "./controller";
import { createDraftSyncService } from "./service";

export const createDraftSyncRouter = (): Router => {
  const router = Router();
  const service = createDraftSyncService();
  const controller = new DraftSyncController(service);

  router.get(
    "/drafts/:draftId",
    requireAuthMiddleware,
    requireCapabilityMiddleware("draft:sync"),
    controller.getSnapshot
  );
  router.post(
    "/drafts/sync",
    requireAuthMiddleware,
    requireCapabilityMiddleware("draft:sync"),
    controller.syncPatch
  );

  return router;
};
