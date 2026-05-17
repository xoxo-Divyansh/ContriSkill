import request from "supertest";
import { describe, expect, it } from "vitest";

import { getApiEnv } from "../src/config/env";
import { requestActorHeaderKeys } from "../src/modules/auth/types";
import { createServer } from "../src/server";

const requesterHeaders = {
  [requestActorHeaderKeys.actorType]: "authenticated",
  [requestActorHeaderKeys.sessionState]: "authenticated",
  [requestActorHeaderKeys.role]: "user",
  [requestActorHeaderKeys.userId]: "usr_requester"
};

const contributorHeaders = {
  [requestActorHeaderKeys.actorType]: "authenticated",
  [requestActorHeaderKeys.sessionState]: "authenticated",
  [requestActorHeaderKeys.role]: "user",
  [requestActorHeaderKeys.userId]: "usr_contributor"
};

describe("contribution API integration", () => {
  it("creates contribution post with authenticated actor", async () => {
    const app = createServer(getApiEnv());

    const response = await request(app).post("/api/v1/posts").set(requesterHeaders).send({
      type: "mentorship",
      title: "Need review",
      description: "Review auth architecture",
      difficulty: "medium",
      creditOffer: 50
    });

    expect(response.status).toBe(201);
    expect(response.body?.data?.post?.id).toBeDefined();
    expect(response.body?.data?.post?.state).toBe("open");
    expect(response.body?.data?.meta?.events?.[0]?.type).toBe("post.created");
  });

  it("rejects unauthenticated contribution creation", async () => {
    const app = createServer(getApiEnv());

    const response = await request(app).post("/api/v1/posts").send({
      type: "mentorship",
      title: "Need review",
      description: "Review auth architecture",
      difficulty: "medium",
      creditOffer: 50
    });

    expect(response.status).toBe(401);
    expect(response.body?.error?.code).toBe("UNAUTHENTICATED");
  });

  it("returns validation error for invalid post payload", async () => {
    const app = createServer(getApiEnv());

    const response = await request(app).post("/api/v1/posts").set(requesterHeaders).send({
      type: "not_a_type",
      title: "",
      description: "desc",
      difficulty: "medium",
      creditOffer: "invalid"
    });

    expect(response.status).toBe(422);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("orchestrates application submit and accept workflow", async () => {
    const app = createServer(getApiEnv());

    const createPostResponse = await request(app).post("/api/v1/posts").set(requesterHeaders).send({
      type: "collaboration",
      title: "Need contributor",
      description: "Need clean architecture pair",
      difficulty: "high",
      creditOffer: 70
    });

    const postId: string = createPostResponse.body?.data?.post?.id;
    const submitApplicationResponse = await request(app)
      .post(`/api/v1/posts/${postId}/applications`)
      .set(contributorHeaders)
      .send({ message: "I can help with this task." });

    const applicationId: string = submitApplicationResponse.body?.data?.application?.id;
    const acceptApplicationResponse = await request(app)
      .post(`/api/v1/posts/${postId}/applications/${applicationId}/accept`)
      .set(requesterHeaders)
      .send({});

    expect(submitApplicationResponse.status).toBe(201);
    expect(submitApplicationResponse.body?.data?.application?.postId).toBe(postId);
    expect(acceptApplicationResponse.status).toBe(202);
    expect(acceptApplicationResponse.body?.data?.collaboration?.postId).toBe(postId);
    expect(acceptApplicationResponse.body?.data?.meta?.events).toHaveLength(3);
  });

  it("enforces owner boundary for post updates", async () => {
    const app = createServer(getApiEnv());

    const createResponse = await request(app).post("/api/v1/posts").set(requesterHeaders).send({
      type: "educational",
      title: "Initial title",
      description: "Initial description",
      difficulty: "low",
      creditOffer: 20
    });

    const postId: string = createResponse.body?.data?.post?.id;

    const updateResponse = await request(app)
      .patch(`/api/v1/posts/${postId}`)
      .set(contributorHeaders)
      .send({ title: "Unauthorized edit attempt" });

    expect(updateResponse.status).toBe(403);
    expect(updateResponse.body?.error?.code).toBe("FORBIDDEN");
  });
});
