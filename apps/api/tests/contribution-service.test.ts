import { describe, expect, it } from "vitest";

import type {
    ContributionApplication,
    ContributionCollaboration,
    ContributionDomainEvent,
    ContributionEventRepository,
    ContributionPost,
    ContributionRepository,
    CreateContributionPostInput
} from "../../../packages/domain/src/contribution/index.js";
import type { RequestActor } from "../src/modules/auth/types";
import { ContributionServiceError, createContributionService } from "../src/modules/contribution";

class InMemoryContributionRepository implements ContributionRepository {
  private readonly posts = new Map<string, ContributionPost>();
  private readonly applications = new Map<string, ContributionApplication>();
  private readonly collaborations = new Map<string, ContributionCollaboration>();

  async listPosts(input: any): Promise<{ items: ContributionPost[] }> {
    // Minimal implementation for test compatibility
    return {
      items: Array.from(this.posts.values())
    };
  }

  async createPost(input: CreateContributionPostInput): Promise<ContributionPost> {
    const id = `post_${this.posts.size + 1}`;
    const post: ContributionPost = {
      id,
      creatorUserId: input.creatorUserId,
      type: input.type,
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      creditOffer: input.creditOffer,
      state: "open",
      createdAt: new Date().toISOString()
    };
    this.posts.set(id, post);
    return post;
  }

  async getPostById(postId: string): Promise<ContributionPost | undefined> {
    return this.posts.get(postId);
  }

  async updatePostDetails(
    postId: string,
    update: Partial<Pick<ContributionPost, "title" | "description" | "difficulty" | "creditOffer">>
  ): Promise<ContributionPost> {
    const existing = this.posts.get(postId);
    if (!existing) {
      throw new Error("post not found");
    }
    const updated: ContributionPost = {
      ...existing,
      ...update
    };
    this.posts.set(postId, updated);
    return updated;
  }

  async updatePostState(
    postId: string,
    state: ContributionPost["state"]
  ): Promise<ContributionPost> {
    const existing = this.posts.get(postId);
    if (!existing) {
      throw new Error("post not found");
    }
    const updated: ContributionPost = {
      ...existing,
      state
    };
    this.posts.set(postId, updated);
    return updated;
  }

  async createApplication(input: {
    postId: string;
    applicantUserId: string;
    message: string;
  }): Promise<ContributionApplication> {
    const id = `app_${this.applications.size + 1}`;
    const application: ContributionApplication = {
      id,
      postId: input.postId,
      applicantUserId: input.applicantUserId,
      message: input.message,
      createdAt: new Date().toISOString()
    };
    this.applications.set(id, application);
    return application;
  }

  async listApplicationsByPost(postId: string): Promise<ContributionApplication[]> {
    return [...this.applications.values()].filter((application) => application.postId === postId);
  }

  async createCollaboration(input: {
    postId: string;
    requesterUserId: string;
    contributorUserId: string;
  }): Promise<ContributionCollaboration> {
    const id = `col_${this.collaborations.size + 1}`;
    const collaboration: ContributionCollaboration = {
      id,
      postId: input.postId,
      requesterUserId: input.requesterUserId,
      contributorUserId: input.contributorUserId,
      state: "pending"
    };
    this.collaborations.set(id, collaboration);
    return collaboration;
  }

  async getCollaborationById(
    collaborationId: string
  ): Promise<ContributionCollaboration | undefined> {
    return this.collaborations.get(collaborationId);
  }

  async updateCollaborationState(
    collaborationId: string,
    state: ContributionCollaboration["state"]
  ): Promise<ContributionCollaboration> {
    const existing = this.collaborations.get(collaborationId);
    if (!existing) {
      throw new Error("collaboration not found");
    }
    const updated: ContributionCollaboration = {
      ...existing,
      state
    };
    this.collaborations.set(collaborationId, updated);
    return updated;
  }
}

class InMemoryContributionEventRepository implements ContributionEventRepository {
  readonly events: ContributionDomainEvent[] = [];

  async appendEvent(event: ContributionDomainEvent): Promise<void> {
    this.events.push(event);
  }

  async listEventsByAggregate(input: {
    aggregateType: ContributionDomainEvent["aggregateType"];
    aggregateId: string;
  }): Promise<ContributionDomainEvent[]> {
    return this.events.filter(
      (event) =>
        event.aggregateType === input.aggregateType && event.aggregateId === input.aggregateId
    );
  }
}

const createActor = (userId: string, role: RequestActor["role"] = "user"): RequestActor => {
  return {
    actorType: "authenticated",
    role,
    sessionState: "authenticated",
    userId
  };
};

describe("contribution application service", () => {
  it("creates contribution and appends creation event", async () => {
    const repository = new InMemoryContributionRepository();
    const eventRepository = new InMemoryContributionEventRepository();
    const service = createContributionService({
      repository,
      eventRepository
    });

    const result = await service.createContribution(createActor("usr_1"), {
      type: "mentorship",
      title: "Need auth help",
      description: "Review auth flow",
      difficulty: "medium",
      creditOffer: 40
    });

    expect(result.data.id).toBeDefined();
    expect(result.events[0]?.type).toBe("post.created");
    expect(eventRepository.events).toHaveLength(1);
  });

  it("updates contribution details with authorization and event append", async () => {
    const repository = new InMemoryContributionRepository();
    const eventRepository = new InMemoryContributionEventRepository();
    const service = createContributionService({ repository, eventRepository });

    const created = await service.createContribution(createActor("usr_1"), {
      type: "collaboration",
      title: "Original title",
      description: "Original description",
      difficulty: "low",
      creditOffer: 20
    });

    const updated = await service.updateContribution(createActor("usr_1"), created.data.id, {
      title: "Updated title"
    });

    expect(updated.data.title).toBe("Updated title");
    expect(updated.events[0]?.type).toBe("post.updated");
  });

  it("rejects contribution updates by non-owner actor", async () => {
    const repository = new InMemoryContributionRepository();
    const eventRepository = new InMemoryContributionEventRepository();
    const service = createContributionService({ repository, eventRepository });

    const created = await service.createContribution(createActor("usr_owner"), {
      type: "educational",
      title: "Post",
      description: "Desc",
      difficulty: "medium",
      creditOffer: 30
    });

    await expect(
      service.updateContribution(createActor("usr_other"), created.data.id, { title: "Hack" })
    ).rejects.toThrowError(ContributionServiceError);
  });

  it("submits and accepts application through orchestrated flow", async () => {
    const repository = new InMemoryContributionRepository();
    const eventRepository = new InMemoryContributionEventRepository();
    const service = createContributionService({ repository, eventRepository });

    const created = await service.createContribution(createActor("usr_requester"), {
      type: "mentorship",
      title: "Need review",
      description: "Review code",
      difficulty: "high",
      creditOffer: 60
    });

    const applicationResult = await service.submitApplication(createActor("usr_contributor"), {
      postId: created.data.id,
      message: "I can help"
    });

    const collaborationResult = await service.acceptApplication(createActor("usr_requester"), {
      postId: created.data.id,
      applicationId: applicationResult.data.id
    });

    expect(applicationResult.events[0]?.type).toBe("application.submitted");
    expect(collaborationResult.events.some((event) => event.type === "application.accepted")).toBe(
      true
    );
    expect(collaborationResult.data.requesterUserId).toBe("usr_requester");
    expect(collaborationResult.data.contributorUserId).toBe("usr_contributor");
  });

  it("supports explicit lifecycle transition orchestration", async () => {
    const repository = new InMemoryContributionRepository();
    const eventRepository = new InMemoryContributionEventRepository();
    const service = createContributionService({ repository, eventRepository });

    const created = await service.createContribution(createActor("usr_1"), {
      type: "problem_solving",
      title: "Need bugfix",
      description: "Fix issue",
      difficulty: "low",
      creditOffer: 10
    });

    await service.transitionContribution(createActor("usr_1"), {
      postId: created.data.id,
      nextState: "in_review"
    });
    const transitioned = await service.transitionContribution(createActor("usr_1"), {
      postId: created.data.id,
      nextState: "accepted"
    });

    expect(transitioned.data.state).toBe("accepted");
    expect(transitioned.events[0]?.type).toBe("post.state_changed");
  });
});
