export const postStates = [
  "open",
  "in_review",
  "accepted",
  "in_progress",
  "completed",
  "verified",
  "disputed",
  "cancelled",
  "expired"
] as const;

export type PostState = (typeof postStates)[number];

export const collaborationStates = [
  "pending",
  "active",
  "awaiting_verification",
  "verified",
  "disputed",
  "failed",
  "cancelled",
  "under_moderation"
] as const;

export type CollaborationState = (typeof collaborationStates)[number];
