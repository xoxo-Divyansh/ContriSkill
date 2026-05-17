import { describe, expect, it } from "vitest";

import {
  ContributionDomainError,
  assertCanAcceptApplication,
  assertCanSubmitApplication,
  assertCanSubmitVerification,
  assertValidPostCreation,
  type ContributionApplication,
  type ContributionCollaboration,
  type ContributionPost
} from "../src/contribution/index.js";

const samplePost: ContributionPost = {
  id: "post_1",
  creatorUserId: "usr_requester",
  type: "mentorship",
  title: "Auth review support needed",
  description: "Need help with auth flow hardening.",
  difficulty: "medium",
  creditOffer: 50,
  state: "open",
  createdAt: new Date().toISOString()
};

describe("contribution policies", () => {
  it("validates post creation inputs", () => {
    expect(() =>
      assertValidPostCreation({
        creatorUserId: "usr_requester",
        title: "Need help",
        description: "Need review",
        creditOffer: 20
      })
    ).not.toThrow();
  });

  it("rejects invalid post creation inputs", () => {
    expect(() =>
      assertValidPostCreation({
        creatorUserId: "",
        title: "",
        description: "",
        creditOffer: 0
      })
    ).toThrowError(ContributionDomainError);
  });

  it("allows valid application submission", () => {
    expect(() => assertCanSubmitApplication(samplePost, "usr_contributor")).not.toThrow();
  });

  it("rejects self-application", () => {
    expect(() => assertCanSubmitApplication(samplePost, "usr_requester")).toThrowError(
      ContributionDomainError
    );
  });

  it("allows requester to accept linked application", () => {
    const application: ContributionApplication = {
      id: "app_1",
      postId: samplePost.id,
      applicantUserId: "usr_contributor",
      message: "I can help with this.",
      createdAt: new Date().toISOString()
    };

    expect(() =>
      assertCanAcceptApplication(
        { actorRole: "requester", actorUserId: "usr_requester" },
        samplePost,
        application
      )
    ).not.toThrow();
  });

  it("rejects non-requester acceptance attempts", () => {
    const application: ContributionApplication = {
      id: "app_1",
      postId: samplePost.id,
      applicantUserId: "usr_contributor",
      message: "I can help with this.",
      createdAt: new Date().toISOString()
    };

    expect(() =>
      assertCanAcceptApplication(
        { actorRole: "contributor", actorUserId: "usr_other" },
        samplePost,
        application
      )
    ).toThrowError(ContributionDomainError);
  });

  it("restricts verification submission to participants in awaiting_verification", () => {
    const collaboration: ContributionCollaboration = {
      id: "col_1",
      postId: "post_1",
      requesterUserId: "usr_requester",
      contributorUserId: "usr_contributor",
      state: "awaiting_verification"
    };

    expect(() =>
      assertCanSubmitVerification(
        { actorRole: "requester", actorUserId: "usr_requester" },
        collaboration
      )
    ).not.toThrow();

    expect(() =>
      assertCanSubmitVerification(
        { actorRole: "contributor", actorUserId: "usr_non_participant" },
        collaboration
      )
    ).toThrowError(ContributionDomainError);
  });
});
