import type { ContributionPost } from "@contriskill/domain";
import type { Request, Response } from "express";

import { sendApiError } from "../../api-error";

import type {
  AcceptApplicationResponse,
  CancelContributionResponse,
  ContributionDetailResponse,
  ContributionErrorResponse,
  CreateContributionResponse,
  ListContributionsResponse,
  SubmitApplicationResponse,
  TransitionContributionResponse,
  UpdateContributionResponse
} from "./contracts";
import { ContributionServiceError } from "./errors";
import type {
  ContributionQueryService,
  ContributionService,
  ContributionServiceResult
} from "./types";
import {
  validateCancelContributionBody,
  validateCreateContributionBody,
  validateSubmitApplicationBody,
  validateTransitionContributionBody,
  validateUpdateContributionBody
} from "./validation";

const httpStatus = {
  created: 201,
  accepted: 202,
  ok: 200,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  unprocessableEntity: 422,
  conflict: 409
} as const;

const mapServiceErrorToHttp = (
  response: Response<ContributionErrorResponse>,
  error: ContributionServiceError
): void => {
  switch (error.code) {
    case "CONTRIBUTION_UNAUTHENTICATED":
      sendApiError(response, httpStatus.unauthorized, "UNAUTHENTICATED", error.message, error.details);
      return;
    case "CONTRIBUTION_FORBIDDEN":
      sendApiError(response, httpStatus.forbidden, "FORBIDDEN", error.message, error.details);
      return;
    case "CONTRIBUTION_NOT_FOUND":
      sendApiError(response, httpStatus.notFound, "NOT_FOUND", error.message, error.details);
      return;
    case "CONTRIBUTION_VALIDATION_FAILED":
      sendApiError(
        response,
        httpStatus.unprocessableEntity,
        "VALIDATION_ERROR",
        error.message,
        error.details
      );
      return;
    case "CONTRIBUTION_CONFLICT":
      sendApiError(response, httpStatus.conflict, "STATE_CONFLICT", error.message, error.details);
      return;
    default:
      sendApiError(response, httpStatus.conflict, "STATE_CONFLICT", "Contribution operation failed.");
  }
};

const toEventMeta = (events: ContributionServiceResult<unknown>["events"]) => {
  return {
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId
    }))
  };
};

const getPathParam = (value: string | string[] | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class ContributionController {
  constructor(
    private readonly service: ContributionService,
    private readonly queryService: ContributionQueryService
  ) {}

  private decodeCursor = (encodedCursor: string): { createdAt: string; id: string } | undefined => {
    try {
      const decoded = Buffer.from(encodedCursor, "base64").toString("utf8");
      const parsed = JSON.parse(decoded) as { createdAt?: string; id?: string };
      if (!parsed.createdAt || !parsed.id) {
        return undefined;
      }
      return { createdAt: parsed.createdAt, id: parsed.id };
    } catch {
      return undefined;
    }
  };

  private encodeCursor = (cursor: { createdAt: string; id: string }): string => {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64");
  };

  list = async (
    request: Request,
    response: Response<ListContributionsResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const rawLimit = typeof request.query.limit === "string" ? request.query.limit : undefined;
    const limit = rawLimit ? Number(rawLimit) : 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      sendApiError(
        response,
        httpStatus.unprocessableEntity,
        "VALIDATION_ERROR",
        "limit must be an integer between 1 and 50."
      );
      return;
    }

    const cursorRaw = typeof request.query.cursor === "string" ? request.query.cursor : undefined;
    const cursor = cursorRaw ? this.decodeCursor(cursorRaw) : undefined;
    if (cursorRaw && !cursor) {
      sendApiError(response, httpStatus.unprocessableEntity, "VALIDATION_ERROR", "cursor is invalid.");
      return;
    }

    const state =
      typeof request.query.state === "string"
        ? (request.query.state as ContributionPost["state"])
        : undefined;
    const type =
      typeof request.query.type === "string"
        ? (request.query.type as ContributionPost["type"])
        : undefined;
    const difficulty =
      typeof request.query.difficulty === "string"
        ? (request.query.difficulty as ContributionPost["difficulty"])
        : undefined;
    const sort =
      request.query.sort === "created_at_asc" || request.query.sort === "created_at_desc"
        ? request.query.sort
        : "created_at_desc";

    try {
      const result = await this.queryService.listContributions(request.actor, {
        limit,
        ...(cursor ? { cursor } : {}),
        ...(state ? { state } : {}),
        ...(type ? { type } : {}),
        ...(difficulty ? { difficulty } : {}),
        sort
      });

      response.status(httpStatus.ok).json({
        data: {
          items: result.items,
          page: {
            hasMore: Boolean(result.nextCursor),
            ...(result.nextCursor ? { nextCursor: this.encodeCursor(result.nextCursor) } : {})
          }
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  detail = async (
    request: Request,
    response: Response<ContributionDetailResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const postId = getPathParam(request.params.postId);
    if (!postId) {
      sendApiError(
        response,
        httpStatus.unprocessableEntity,
        "VALIDATION_ERROR",
        "postId is required."
      );
      return;
    }

    try {
      const post = await this.queryService.getContributionById(request.actor, postId);
      if (!post) {
        sendApiError(response, httpStatus.notFound, "NOT_FOUND", "Contribution post not found.");
        return;
      }

      response.status(httpStatus.ok).json({
        data: {
          post
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  create = async (
    request: Request,
    response: Response<CreateContributionResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const validation = validateCreateContributionBody(request.body);
    if (!validation.ok) {
      sendApiError(response, httpStatus.unprocessableEntity, "VALIDATION_ERROR", validation.message);
      return;
    }

    try {
      const result = await this.service.createContribution(request.actor, validation.value);
      response.status(httpStatus.created).json({
        data: {
          post: result.data,
          meta: toEventMeta(result.events)
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  update = async (
    request: Request,
    response: Response<UpdateContributionResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const validation = validateUpdateContributionBody(request.body);
    if (!validation.ok) {
      sendApiError(response, httpStatus.unprocessableEntity, "VALIDATION_ERROR", validation.message);
      return;
    }

    try {
      const postId = getPathParam(request.params.postId);
      if (!postId) {
        sendApiError(
          response,
          httpStatus.unprocessableEntity,
          "VALIDATION_ERROR",
          "postId is required."
        );
        return;
      }

      const result = await this.service.updateContribution(request.actor, postId, validation.value);
      response.status(httpStatus.ok).json({
        data: {
          post: result.data,
          meta: toEventMeta(result.events)
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  cancel = async (
    request: Request,
    response: Response<CancelContributionResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const validation = validateCancelContributionBody(request.body);
    if (!validation.ok) {
      sendApiError(response, httpStatus.unprocessableEntity, "VALIDATION_ERROR", validation.message);
      return;
    }

    try {
      const postId = getPathParam(request.params.postId);
      if (!postId) {
        sendApiError(
          response,
          httpStatus.unprocessableEntity,
          "VALIDATION_ERROR",
          "postId is required."
        );
        return;
      }

      const result = await this.service.cancelContribution(
        request.actor,
        postId,
        validation.value.reason
      );
      response.status(httpStatus.ok).json({
        data: {
          post: result.data,
          meta: toEventMeta(result.events)
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  transition = async (
    request: Request,
    response: Response<TransitionContributionResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const validation = validateTransitionContributionBody(request.body);
    if (!validation.ok) {
      sendApiError(response, httpStatus.unprocessableEntity, "VALIDATION_ERROR", validation.message);
      return;
    }

    try {
      const postId = getPathParam(request.params.postId);
      if (!postId) {
        sendApiError(
          response,
          httpStatus.unprocessableEntity,
          "VALIDATION_ERROR",
          "postId is required."
        );
        return;
      }

      const result = await this.service.transitionContribution(request.actor, {
        postId,
        ...validation.value
      });
      response.status(httpStatus.ok).json({
        data: {
          post: result.data,
          meta: toEventMeta(result.events)
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  submitApplication = async (
    request: Request,
    response: Response<SubmitApplicationResponse | ContributionErrorResponse>
  ): Promise<void> => {
    const validation = validateSubmitApplicationBody(request.body);
    if (!validation.ok) {
      sendApiError(response, httpStatus.unprocessableEntity, "VALIDATION_ERROR", validation.message);
      return;
    }

    try {
      const postId = getPathParam(request.params.postId);
      if (!postId) {
        sendApiError(
          response,
          httpStatus.unprocessableEntity,
          "VALIDATION_ERROR",
          "postId is required."
        );
        return;
      }

      const result = await this.service.submitApplication(request.actor, {
        postId,
        message: validation.value.message
      });
      response.status(httpStatus.created).json({
        data: {
          application: result.data,
          meta: toEventMeta(result.events)
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };

  acceptApplication = async (
    request: Request,
    response: Response<AcceptApplicationResponse | ContributionErrorResponse>
  ): Promise<void> => {
    try {
      const postId = getPathParam(request.params.postId);
      const applicationId = getPathParam(request.params.applicationId);
      if (!postId || !applicationId) {
        sendApiError(
          response,
          httpStatus.unprocessableEntity,
          "VALIDATION_ERROR",
          "postId and applicationId are required."
        );
        return;
      }

      const result = await this.service.acceptApplication(request.actor, {
        postId,
        applicationId
      });
      response.status(httpStatus.accepted).json({
        data: {
          collaboration: result.data,
          meta: toEventMeta(result.events)
        }
      });
    } catch (error) {
      if (error instanceof ContributionServiceError) {
        mapServiceErrorToHttp(response, error);
        return;
      }
      throw error;
    }
  };
}
