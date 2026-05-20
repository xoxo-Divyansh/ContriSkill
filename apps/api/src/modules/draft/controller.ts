import type { Request, Response } from "express";

import type {
  DraftSyncErrorResponse,
  DraftSyncPatchResponse,
  DraftSyncSnapshotResponse
} from "./contracts";
import type { DraftSyncService } from "./types";
import { validateDraftPatchEnvelope } from "./validation";

export class DraftSyncController {
  constructor(private readonly service: DraftSyncService) {}

  getSnapshot = (
    request: Request,
    response: Response<DraftSyncSnapshotResponse | DraftSyncErrorResponse>
  ): void => {
    const rawDraftId = request.params.draftId;
    const draftId = typeof rawDraftId === "string" ? rawDraftId.trim() : undefined;
    if (!draftId) {
      response.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "draftId is required."
        }
      });
      return;
    }

    const snapshot = this.service.getSnapshotById(draftId);
    if (!snapshot) {
      response.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Draft snapshot not found."
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

  syncPatch = (
    request: Request,
    response: Response<DraftSyncPatchResponse | DraftSyncErrorResponse>
  ): void => {
    const validation = validateDraftPatchEnvelope(request.body);
    if (!validation.ok) {
      response.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: validation.message
        }
      });
      return;
    }

    const result = this.service.submitPatch({
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
