export const contributionErrorCodes = [
  "CONTRIBUTION_INVALID_TRANSITION",
  "CONTRIBUTION_POLICY_VIOLATION",
  "CONTRIBUTION_NOT_FOUND",
  "CONTRIBUTION_FORBIDDEN",
  "CONTRIBUTION_CONFLICT"
] as const;

export type ContributionErrorCode = (typeof contributionErrorCodes)[number];

export class ContributionDomainError extends Error {
  constructor(
    public readonly code: ContributionErrorCode,
    message: string,
    public readonly details?: Record<string, string | number | boolean>
  ) {
    super(message);
    this.name = "ContributionDomainError";
  }
}
