import type { Request, Response } from "express";

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
      response.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "projectionId is required."
        }
      });
      return;
    }

    const snapshot = this.service.getSnapshotById(projectionId);
    if (!snapshot) {
      response.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Projection snapshot not found."
        }
      });
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
      response.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: validation.message
        }
      });
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
