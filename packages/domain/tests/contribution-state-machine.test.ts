import { describe, expect, it } from "vitest";

import {
  ContributionDomainError,
  transitionCollaborationState,
  transitionPostState
} from "../src/contribution/index.js";

describe("contribution state machine", () => {
  it("allows valid post lifecycle transitions", () => {
    const inReview = transitionPostState("open", "in_review");
    const accepted = transitionPostState(inReview, "accepted");
    const inProgress = transitionPostState(accepted, "in_progress");
    const completed = transitionPostState(inProgress, "completed");
    const verified = transitionPostState(completed, "verified");

    expect(verified).toBe("verified");
  });

  it("rejects invalid post lifecycle transitions", () => {
    expect(() => transitionPostState("open", "verified")).toThrowError(ContributionDomainError);
  });

  it("allows valid collaboration lifecycle transitions", () => {
    const active = transitionCollaborationState("pending", "active");
    const awaitingVerification = transitionCollaborationState(active, "awaiting_verification");
    const verified = transitionCollaborationState(awaitingVerification, "verified");

    expect(verified).toBe("verified");
  });

  it("rejects invalid collaboration lifecycle transitions", () => {
    expect(() => transitionCollaborationState("pending", "awaiting_verification")).toThrowError(
      ContributionDomainError
    );
  });
});
