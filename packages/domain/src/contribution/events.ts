import type { ContributionCollaborationState, ContributionPostState } from "./types.js";

export const contributionEventTypes = [
  "post.created",
  "post.updated",
  "post.state_changed",
  "application.submitted",
  "application.accepted",
  "application.rejected",
  "collaboration.started",
  "collaboration.submitted_for_verification",
  "verification.approved",
  "verification.rejected",
  "collaboration.disputed",
  "audit.entry_written"
] as const;

export type ContributionEventType = (typeof contributionEventTypes)[number];

export type ContributionDomainEvent = {
  id: string;
  type: ContributionEventType;
  aggregateType: "post" | "collaboration";
  aggregateId: string;
  actorUserId?: string;
  occurredAt: string;
  payload?: Record<string, string | number | boolean | null>;
};

export type ContributionTransitionEvent = ContributionDomainEvent & {
  fromState: ContributionPostState | ContributionCollaborationState;
  toState: ContributionPostState | ContributionCollaborationState;
};

export type ContributionAuditRecord = {
  id: string;
  action: string;
  actorUserId?: string;
  entityType: "post" | "application" | "collaboration";
  entityId: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};
