import { randomUUID } from "node:crypto";

import {
  assertCanAcceptApplication,
  assertCanSubmitApplication,
  assertValidPostCreation,
  type ContributionPostQueryInput,
  type ContributionPostQueryResult,
  ContributionDomainError,
  transitionPostState,
  type ContributionApplication,
  type ContributionCollaboration,
  type ContributionDomainEvent,
  type ContributionPost
} from "../../../../../packages/domain/src/contribution/index.js";
import { assertActorCapability, assertAuthenticatedActor } from "../auth/authorization";
import { AuthorizationError } from "../auth/capabilities";
import type { RequestActor } from "../auth/types";

import { ContributionServiceError } from "./errors";
import type {
  ContributionQueryService,
  AcceptContributionApplicationInput,
  ContributionService,
  ContributionServiceDependencies,
  ContributionServiceResult,
  CreateContributionInput,
  SubmitContributionApplicationInput,
  TransitionContributionInput,
  UpdateContributionInput
} from "./types";

const nowIso = (): string => {
  return new Date().toISOString();
};

const toContributionServiceError = (error: unknown): ContributionServiceError => {
  if (error instanceof ContributionServiceError) {
    return error;
  }

  if (error instanceof AuthorizationError) {
    if (error.code === "UNAUTHENTICATED") {
      return new ContributionServiceError("CONTRIBUTION_UNAUTHENTICATED", error.message);
    }

    return new ContributionServiceError("CONTRIBUTION_FORBIDDEN", error.message);
  }

  if (error instanceof ContributionDomainError) {
    if (error.code === "CONTRIBUTION_NOT_FOUND") {
      return new ContributionServiceError("CONTRIBUTION_NOT_FOUND", error.message, error.details);
    }

    if (error.code === "CONTRIBUTION_FORBIDDEN") {
      return new ContributionServiceError("CONTRIBUTION_FORBIDDEN", error.message, error.details);
    }

    if (error.code === "CONTRIBUTION_CONFLICT") {
      return new ContributionServiceError("CONTRIBUTION_CONFLICT", error.message, error.details);
    }

    return new ContributionServiceError(
      "CONTRIBUTION_VALIDATION_FAILED",
      error.message,
      error.details
    );
  }

  return new ContributionServiceError(
    "CONTRIBUTION_CONFLICT",
    error instanceof Error ? error.message : "Contribution workflow failed."
  );
};

const createEvent = (
  type: ContributionDomainEvent["type"],
  aggregateType: ContributionDomainEvent["aggregateType"],
  aggregateId: string,
  actorUserId?: string,
  payload?: ContributionDomainEvent["payload"]
): ContributionDomainEvent => {
  const event: ContributionDomainEvent = {
    id: `evt_${randomUUID()}`,
    type,
    aggregateType,
    aggregateId,
    occurredAt: nowIso()
  };

  if (actorUserId) {
    event.actorUserId = actorUserId;
  }

  if (payload) {
    event.payload = payload;
  }

  return event;
};

const mapActorToContributionRole = (
  actor: RequestActor,
  post: ContributionPost
): "requester" | "contributor" => {
  return actor.userId === post.creatorUserId ? "requester" : "contributor";
};

const defaultUnitOfWork = {
  run: async <T>(work: () => Promise<T>): Promise<T> => {
    return work();
  }
};

class DefaultContributionService implements ContributionService {
  constructor(private readonly dependencies: ContributionServiceDependencies) {}

  private async withServiceBoundary<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      throw toContributionServiceError(error);
    }
  }

  async createContribution(
    actor: RequestActor | undefined,
    input: CreateContributionInput
  ): Promise<ContributionServiceResult<ContributionPost>> {
    return this.withServiceBoundary(async () => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:create");
      assertValidPostCreation({
        creatorUserId: actor.userId,
        title: input.title,
        description: input.description,
        creditOffer: input.creditOffer
      });

      const unitOfWork = this.dependencies.unitOfWork ?? defaultUnitOfWork;
      return unitOfWork.run(async () => {
        const post = await this.dependencies.repository.createPost({
          creatorUserId: actor.userId,
          type: input.type,
          title: input.title,
          description: input.description,
          difficulty: input.difficulty,
          creditOffer: input.creditOffer
        });

        const event = createEvent("post.created", "post", post.id, actor.userId);
        await this.dependencies.eventRepository.appendEvent(event);

        return {
          data: post,
          events: [event]
        };
      });
    });
  }

  async updateContribution(
    actor: RequestActor | undefined,
    postId: string,
    input: UpdateContributionInput
  ): Promise<ContributionServiceResult<ContributionPost>> {
    return this.withServiceBoundary(async () => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:update");

      const existing = await this.dependencies.repository.getPostById(postId);
      if (!existing) {
        throw new ContributionServiceError(
          "CONTRIBUTION_NOT_FOUND",
          "Contribution post not found."
        );
      }

      if (existing.creatorUserId !== actor.userId) {
        throw new ContributionServiceError(
          "CONTRIBUTION_FORBIDDEN",
          "Only post creator can update contribution."
        );
      }

      const unitOfWork = this.dependencies.unitOfWork ?? defaultUnitOfWork;
      return unitOfWork.run(async () => {
        const updated = await this.dependencies.repository.updatePostDetails(postId, input);
        const event = createEvent("post.updated", "post", updated.id, actor.userId);
        await this.dependencies.eventRepository.appendEvent(event);

        return {
          data: updated,
          events: [event]
        };
      });
    });
  }

  async cancelContribution(
    actor: RequestActor | undefined,
    postId: string,
    reason?: string
  ): Promise<ContributionServiceResult<ContributionPost>> {
    return this.withServiceBoundary(async () => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:cancel");

      const existing = await this.dependencies.repository.getPostById(postId);
      if (!existing) {
        throw new ContributionServiceError(
          "CONTRIBUTION_NOT_FOUND",
          "Contribution post not found."
        );
      }

      if (existing.creatorUserId !== actor.userId) {
        throw new ContributionServiceError(
          "CONTRIBUTION_FORBIDDEN",
          "Only post creator can cancel contribution."
        );
      }

      const nextState = transitionPostState(existing.state, "cancelled");

      const unitOfWork = this.dependencies.unitOfWork ?? defaultUnitOfWork;
      return unitOfWork.run(async () => {
        const updated = await this.dependencies.repository.updatePostState(postId, nextState);
        const event = createEvent("post.state_changed", "post", updated.id, actor.userId, {
          fromState: existing.state,
          toState: nextState,
          reason: reason ?? "user_cancelled"
        });
        await this.dependencies.eventRepository.appendEvent(event);

        return {
          data: updated,
          events: [event]
        };
      });
    });
  }

  async transitionContribution(
    actor: RequestActor | undefined,
    input: TransitionContributionInput
  ): Promise<ContributionServiceResult<ContributionPost>> {
    return this.withServiceBoundary(async () => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:state:transition");

      const existing = await this.dependencies.repository.getPostById(input.postId);
      if (!existing) {
        throw new ContributionServiceError(
          "CONTRIBUTION_NOT_FOUND",
          "Contribution post not found."
        );
      }

      if (existing.creatorUserId !== actor.userId) {
        throw new ContributionServiceError(
          "CONTRIBUTION_FORBIDDEN",
          "Only post creator can transition contribution state."
        );
      }

      const nextState = transitionPostState(existing.state, input.nextState);

      const unitOfWork = this.dependencies.unitOfWork ?? defaultUnitOfWork;
      return unitOfWork.run(async () => {
        const updated = await this.dependencies.repository.updatePostState(input.postId, nextState);
        const event = createEvent("post.state_changed", "post", updated.id, actor.userId, {
          fromState: existing.state,
          toState: nextState,
          reason: input.reason ?? "manual_transition"
        });
        await this.dependencies.eventRepository.appendEvent(event);

        return {
          data: updated,
          events: [event]
        };
      });
    });
  }

  async submitApplication(
    actor: RequestActor | undefined,
    input: SubmitContributionApplicationInput
  ): Promise<ContributionServiceResult<ContributionApplication>> {
    return this.withServiceBoundary(async () => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:application:submit");

      const post = await this.dependencies.repository.getPostById(input.postId);
      if (!post) {
        throw new ContributionServiceError(
          "CONTRIBUTION_NOT_FOUND",
          "Contribution post not found."
        );
      }

      assertCanSubmitApplication(post, actor.userId);

      const unitOfWork = this.dependencies.unitOfWork ?? defaultUnitOfWork;
      return unitOfWork.run(async () => {
        const application = await this.dependencies.repository.createApplication({
          postId: post.id,
          applicantUserId: actor.userId,
          message: input.message
        });
        const event = createEvent("application.submitted", "post", post.id, actor.userId, {
          applicationId: application.id
        });
        await this.dependencies.eventRepository.appendEvent(event);

        return {
          data: application,
          events: [event]
        };
      });
    });
  }

  async acceptApplication(
    actor: RequestActor | undefined,
    input: AcceptContributionApplicationInput
  ): Promise<ContributionServiceResult<ContributionCollaboration>> {
    return this.withServiceBoundary(async () => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:application:accept");

      const post = await this.dependencies.repository.getPostById(input.postId);
      if (!post) {
        throw new ContributionServiceError(
          "CONTRIBUTION_NOT_FOUND",
          "Contribution post not found."
        );
      }

      const applications = await this.dependencies.repository.listApplicationsByPost(post.id);
      const application = applications.find((item) => item.id === input.applicationId);
      if (!application) {
        throw new ContributionServiceError(
          "CONTRIBUTION_NOT_FOUND",
          "Contribution application not found."
        );
      }

      assertCanAcceptApplication(
        {
          actorRole: mapActorToContributionRole(actor, post),
          actorUserId: actor.userId
        },
        post,
        application
      );

      const nextPostState = transitionPostState(post.state, "accepted");

      const unitOfWork = this.dependencies.unitOfWork ?? defaultUnitOfWork;
      return unitOfWork.run(async () => {
        const updatedPost = await this.dependencies.repository.updatePostState(
          post.id,
          nextPostState
        );
        const collaboration = await this.dependencies.repository.createCollaboration({
          postId: updatedPost.id,
          requesterUserId: post.creatorUserId,
          contributorUserId: application.applicantUserId
        });

        const events: ContributionDomainEvent[] = [
          createEvent("application.accepted", "post", post.id, actor.userId, {
            applicationId: application.id
          }),
          createEvent("post.state_changed", "post", post.id, actor.userId, {
            fromState: post.state,
            toState: nextPostState
          }),
          createEvent("collaboration.started", "collaboration", collaboration.id, actor.userId, {
            postId: post.id
          })
        ];

        await Promise.all(
          events.map((event) => this.dependencies.eventRepository.appendEvent(event))
        );

        return {
          data: collaboration,
          events
        };
      });
    });
  }
}

export const createContributionService = (
  dependencies: ContributionServiceDependencies
): ContributionService => {
  return new DefaultContributionService(dependencies);
};

export const createContributionQueryService = (
  dependencies: ContributionServiceDependencies
): ContributionQueryService => {
  return {
    listContributions: async (
      actor: RequestActor | undefined,
      input: ContributionPostQueryInput
    ): Promise<ContributionPostQueryResult> => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:read");
      return dependencies.repository.listPosts(input);
    },
    getContributionById: async (
      actor: RequestActor | undefined,
      postId: string
    ): Promise<ContributionPost | undefined> => {
      assertAuthenticatedActor(actor);
      assertActorCapability(actor, "contribution:read");
      return dependencies.repository.getPostById(postId);
    }
  };
};
