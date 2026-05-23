import type { Request, Response } from "express";

import { sendApiError } from "../../api-error";

import type { MutationIntakeErrorResponse, MutationIntakeResponse } from "./contracts";
import type { MutationIntakeService } from "./types";
import { validateMutationEnvelope } from "./validation";

export class MutationController {
  constructor(private readonly service: MutationIntakeService) {}

  submit = (
    request: Request,
    response: Response<MutationIntakeResponse | MutationIntakeErrorResponse>
  ): void => {
    const validation = validateMutationEnvelope(request.body);
    if (!validation.ok) {
      sendApiError(response, 422, "VALIDATION_ERROR", validation.message);
      return;
    }

    const result = this.service.submitMutation({
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
