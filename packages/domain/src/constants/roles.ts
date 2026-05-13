export const roles = ["public", "user", "participant", "owner", "moderator", "admin"] as const;

export type Role = (typeof roles)[number];

export const defaultRole: Role = "public";
