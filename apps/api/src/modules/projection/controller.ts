import type { Request, Response } from "express";

import { sendApiError } from "../../api-error";

import type {
  ProjectionSyncErrorResponse,
  ProjectionSyncSnapshotResponse,
  ProjectionSyncUpdateResponse
} from "./contracts";
import type { ProjectionSyncService } from "./types";
import { validateProjectionUpdateEnvelope } from "./validation";

export class ProjectionSyncController {
  constructor(private readonly service: ProjectionSyncService) {}

  getSnapshot = (
    request: Request,
    response: Response<ProjectionSyncSnapshotResponse | ProjectionSyncErrorResponse>
  ): void => {
    const rawProjectionId = request.params.projectionId;
    const projectionId = typeof rawProjectionId === "string" ? rawProjectionId.trim() : undefined;
    if (!projectionId) {
      sendApiError(response, 422, "VALIDATION_ERROR", "projectionId is required.");
      return;
    }

    const snapshot = this.service.getSnapshotById(projectionId);
    if (!snapshot) {
      sendApiError(response, 404, "NOT_FOUND", "Projection snapshot not found.");
      return;
    }

    response.status(200).json({
      data: {
        snapshot
      }
    });
  };

  syncUpdate = (
    request: Request,
    response: Response<ProjectionSyncUpdateResponse | ProjectionSyncErrorResponse>
  ): void => {
    const validation = validateProjectionUpdateEnvelope(request.body);
    if (!validation.ok) {
      sendApiError(response, 422, "VALIDATION_ERROR", validation.message);
      return;
    }

    const result = this.service.submitUpdate({
      envelope: validation.value,
      actor: request.actor
    });

    response.status(result.httpStatus).json({
      data: {
        result: result.result
      }
    });
  };
}
