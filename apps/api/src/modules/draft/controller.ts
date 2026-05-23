import type { Request, Response } from "express";

import { sendApiError } from "../../api-error";

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
      sendApiError(response, 422, "VALIDATION_ERROR", "draftId is required.");
      return;
    }

    const snapshot = this.service.getSnapshotById(draftId);
    if (!snapshot) {
      sendApiError(response, 404, "NOT_FOUND", "Draft snapshot not found.");
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
      sendApiError(response, 422, "VALIDATION_ERROR", validation.message);
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
