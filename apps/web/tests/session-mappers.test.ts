import { describe, expect, it } from "vitest";

import { toSessionSnapshot } from "../src/lib/session/session-mappers";

describe("session mappers", () => {
  it("maps actor and session tokens into session snapshot", () => {
    const snapshot = toSessionSnapshot(
      {
        actorType: "authenticated",
        role: "user",
        sessionState: "authenticated",
        userId: "usr_1"
      },
      {
        accessToken: "tok_1",
        refreshToken: "ref_1"
      }
    );

    expect(snapshot.actorType).toBe("authenticated");
    expect(snapshot.userId).toBe("usr_1");
    expect(snapshot.accessToken).toBe("tok_1");
    expect(snapshot.refreshToken).toBe("ref_1");
  });
});
