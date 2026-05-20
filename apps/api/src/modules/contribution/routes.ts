import { Router } from "express";

import type { ApiEnv } from "../../config/env";
import type { DatabaseClient } from "../../db/postgres";
import { requireAuthMiddleware } from "../../middleware/require-auth";
import { requireCapabilityMiddleware } from "../../middleware/require-capability";
import { createContributionBroadcaster } from "../../realtime/broadcaster";

import { ContributionController } from "./controller";
import { createContributionPersistenceRuntime } from "./repository";
import { createContributionQueryService, createContributionService } from "./service";
import { createContributionUnitOfWork } from "./unit-of-work";

export const createContributionRouter = (dependencies: {
  env: ApiEnv;
  databaseClient?: DatabaseClient;
}) => {
  const contributionRouter = Router();
  const runtime = createContributionPersistenceRuntime(dependencies.env, {
    ...(dependencies.databaseClient ? { databaseClient: dependencies.databaseClient } : {})
  });
  const unitOfWork = createContributionUnitOfWork(dependencies.databaseClient);
  const contributionService = createContributionService({
    repository: runtime.repository,
    eventRepository: runtime.eventRepository,
    liveEventPublisher: {
      publishContributionEvents: async (events) => {
        const broadcaster = createContributionBroadcaster();
        for (const event of events) {
          if (event.aggregateType !== "post") {
            continue;
          }
          if (event.type === "post.created") {
            broadcaster.publishCreated({ postId: event.aggregateId });
            continue;
          }
          if (event.type === "post.updated") {
            broadcaster.publishUpdated({ postId: event.aggregateId });
            continue;
          }
          if (event.type === "post.state_changed") {
            const toState =
              typeof event.payload === "object" &&
              event.payload !== null &&
              "toState" in event.payload
                ? String((event.payload as { toState?: unknown }).toState ?? "")
                : undefined;
            broadcaster.publishStateChanged({
              postId: event.aggregateId,
              ...(toState ? { state: toState } : {})
            });
          }
        }
      }
    },
    ...(unitOfWork ? { unitOfWork } : {})
  });
  const contributionQueryService = createContributionQueryService({
    repository: runtime.repository,
    eventRepository: runtime.eventRepository,
    ...(unitOfWork ? { unitOfWork } : {})
  });
  const contributionController = new ContributionController(
    contributionService,
    contributionQueryService
  );

  contributionRouter.get(
    "/posts",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:read"),
    contributionController.list
  );
  contributionRouter.get(
    "/posts/:postId",
    requireAuthMiddleware,
    requireCapabilityMiddleware("contribution:read"),
    contributionController.detail
  );

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
