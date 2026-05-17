export type ContributionServiceErrorCode =
  | "CONTRIBUTION_UNAUTHENTICATED"
  | "CONTRIBUTION_FORBIDDEN"
  | "CONTRIBUTION_NOT_FOUND"
  | "CONTRIBUTION_VALIDATION_FAILED"
  | "CONTRIBUTION_CONFLICT";

export class ContributionServiceError extends Error {
  constructor(
    public readonly code: ContributionServiceErrorCode,
    message: string,
    public readonly details?: Record<string, string | number | boolean>
  ) {
    super(message);
    this.name = "ContributionServiceError";
  }
}
