import type { AuthRole } from "./types";

const rolePrecedence: Record<AuthRole, number> = {
  public: 0,
  user: 1,
  participant: 2,
  owner: 3,
  moderator: 4,
  admin: 5
};

export const isAuthRole = (value: string): value is AuthRole => {
  return value in rolePrecedence;
};

export const hasRequiredRole = (actorRole: AuthRole, requiredRole: AuthRole): boolean => {
  return rolePrecedence[actorRole] >= rolePrecedence[requiredRole];
};
