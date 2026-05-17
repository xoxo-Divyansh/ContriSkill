import { Router } from "express";

import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireCapabilityMiddleware } from "../../middleware/require-capability";

import { ContributionController } from "./controller";
import { createContributionEventRepository, createContributionRepository } from "./repository";
import { createContributionService } from "./service";

export const createContributionRouter = () => {
  const contributionRouter = Router();
  const contributionService = createContributionService({
    repository: createContributionRepository(),
    eventRepository: createContributionEventRepository()
  });
  const contributionController = new ContributionController(contributionService);

  contributionRouter.post(
    "/posts",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:create"),
    contributionController.create
  );
  contributionRouter.patch(
    "/posts/:postId",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:update"),
    contributionController.update
  );
  contributionRouter.post(
    "/posts/:postId/cancel",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:cancel"),
    contributionController.cancel
  );
  contributionRouter.post(
    "/posts/:postId/transitions",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:state:transition"),
    contributionController.transition
  );
  contributionRouter.post(
    "/posts/:postId/applications",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:application:submit"),
    contributionController.submitApplication
  );
  contributionRouter.post(
    "/posts/:postId/applications/:applicationId/accept",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:application:accept"),
    contributionController.acceptApplication
  );

  return contributionRouter;
};
