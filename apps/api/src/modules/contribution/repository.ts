import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionDomainEvent,
  ContributionEventRepository,
  ContributionPost,
  ContributionRepository,
  CreateContributionPostInput
} from "@contriskill/domain";

class InMemoryContributionRepository implements ContributionRepository {
  private readonly posts = new Map<string, ContributionPost>();
  private readonly applications = new Map<string, ContributionApplication>();
  private readonly collaborations = new Map<string, ContributionCollaboration>();

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
      throw new Error("contribution post not found");
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
      throw new Error("contribution post not found");
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
      throw new Error("contribution collaboration not found");
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
  private readonly events: ContributionDomainEvent[] = [];

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

export const createContributionRepository = (): ContributionRepository => {
  return new InMemoryContributionRepository();
};

export const createContributionEventRepository = (): ContributionEventRepository => {
  return new InMemoryContributionEventRepository();
};
