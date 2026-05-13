export const sessionStates = ["anonymous", "authenticated", "expired"] as const;

export type SessionState = (typeof sessionStates)[number];

export const defaultSessionState: SessionState = "anonymous";
