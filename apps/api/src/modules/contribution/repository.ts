import { randomUUID } from "node:crypto";

import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionDomainEvent,
  ContributionEventRepository,
  ContributionPostQueryInput,
  ContributionPostQueryResult,
  ContributionPost,
  ContributionRepository,
  CreateContributionPostInput
} from "@contriskill/domain";

import type { ApiEnv } from "../../config/env";
import type { DatabaseClient } from "../../db/postgres";
import { log } from "../../observability/logger";

type ContributionPostRow = {
  id: string;
  creator_user_id: string;
  post_type: ContributionPost["type"];
  title: string;
  description: string;
  difficulty: ContributionPost["difficulty"];
  credit_offer: number;
  state: ContributionPost["state"];
  created_at: string | Date;
};

type ContributionApplicationRow = {
  id: string;
  post_id: string;
  applicant_user_id: string;
  message: string;
  created_at: string | Date;
};

type ContributionCollaborationRow = {
  id: string;
  post_id: string;
  requester_user_id: string;
  contributor_user_id: string;
  state: ContributionCollaboration["state"];
  started_at: string | Date | null;
  completed_at: string | Date | null;
};

type ContributionEventRow = {
  id: string;
  aggregate_type: ContributionDomainEvent["aggregateType"];
  aggregate_id: string;
  event_type: ContributionDomainEvent["type"];
  actor_user_id: string | null;
  payload_json: Record<string, string | number | boolean | null> | null;
  occurred_at: string | Date;
};

const toIso = (value: string | Date): string => {
  return value instanceof Date ? value.toISOString() : value;
};

const toPost = (row: ContributionPostRow): ContributionPost => {
  return {
    id: row.id,
    creatorUserId: row.creator_user_id,
    type: row.post_type,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    creditOffer: row.credit_offer,
    state: row.state,
    createdAt: toIso(row.created_at)
  };
};

const toApplication = (row: ContributionApplicationRow): ContributionApplication => {
  return {
    id: row.id,
    postId: row.post_id,
    applicantUserId: row.applicant_user_id,
    message: row.message,
    createdAt: toIso(row.created_at)
  };
};

const toCollaboration = (row: ContributionCollaborationRow): ContributionCollaboration => {
  return {
    id: row.id,
    postId: row.post_id,
    requesterUserId: row.requester_user_id,
    contributorUserId: row.contributor_user_id,
    state: row.state,
    ...(row.started_at ? { startedAt: toIso(row.started_at) } : {}),
    ...(row.completed_at ? { completedAt: toIso(row.completed_at) } : {})
  };
};

const toEvent = (row: ContributionEventRow): ContributionDomainEvent => {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    type: row.event_type,
    occurredAt: toIso(row.occurred_at),
    ...(row.actor_user_id ? { actorUserId: row.actor_user_id } : {}),
    ...(row.payload_json ? { payload: row.payload_json } : {})
  };
};

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

  async listPosts(input: ContributionPostQueryInput): Promise<ContributionPostQueryResult> {
    const sorted = [...this.posts.values()]
      .filter((post) => (input.state ? post.state === input.state : true))
      .filter((post) => (input.type ? post.type === input.type : true))
      .filter((post) => (input.difficulty ? post.difficulty === input.difficulty : true))
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();

        if (leftTime === rightTime) {
          return input.sort === "created_at_asc"
            ? left.id.localeCompare(right.id)
            : right.id.localeCompare(left.id);
        }

        return input.sort === "created_at_asc" ? leftTime - rightTime : rightTime - leftTime;
      });

    const filteredByCursor = input.cursor
      ? sorted.filter((post) => {
          const createdAt = new Date(post.createdAt).getTime();
          const cursorCreatedAt = new Date(input.cursor?.createdAt ?? "").getTime();

          if (input.sort === "created_at_asc") {
            return (
              createdAt > cursorCreatedAt ||
              (createdAt === cursorCreatedAt && post.id > (input.cursor?.id ?? ""))
            );
          }

          return (
            createdAt < cursorCreatedAt ||
            (createdAt === cursorCreatedAt && post.id < (input.cursor?.id ?? ""))
          );
        })
      : sorted;

    const items = filteredByCursor.slice(0, input.limit);
    const hasMore = filteredByCursor.length > input.limit;
    const cursorSource = items[items.length - 1];
    return {
      items,
      ...(hasMore && cursorSource
        ? { nextCursor: { createdAt: cursorSource.createdAt, id: cursorSource.id } }
        : {})
    };
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

    const updated: ContributionPost = { ...existing, ...update };
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

    const updated: ContributionPost = { ...existing, state };
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

    const updated: ContributionCollaboration = { ...existing, state };
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

class DbContributionRepository implements ContributionRepository {
  constructor(private readonly client: DatabaseClient) {}

  async createPost(input: CreateContributionPostInput): Promise<ContributionPost> {
    const result = await this.client.query<ContributionPostRow>(
      `insert into contribution_posts
       (id, creator_user_id, post_type, title, description, difficulty, credit_offer, state, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, 'open', now(), now())
       returning id, creator_user_id, post_type, title, description, difficulty, credit_offer, state, created_at`,
      [
        `post_${randomUUID()}`,
        input.creatorUserId,
        input.type,
        input.title,
        input.description,
        input.difficulty,
        input.creditOffer
      ]
    );

    return toPost(result.rows[0] as ContributionPostRow);
  }

  async listPosts(input: ContributionPostQueryInput): Promise<ContributionPostQueryResult> {
    const conditions: string[] = [];
    const values: Array<string | number> = [];

    if (input.state) {
      values.push(input.state);
      conditions.push(`state = $${values.length}`);
    }

    if (input.type) {
      values.push(input.type);
      conditions.push(`post_type = $${values.length}`);
    }

    if (input.difficulty) {
      values.push(input.difficulty);
      conditions.push(`difficulty = $${values.length}`);
    }

    if (input.cursor) {
      values.push(input.cursor.createdAt);
      const createdAtIndex = values.length;
      values.push(input.cursor.id);
      const idIndex = values.length;
      const comparator = input.sort === "created_at_asc" ? ">" : "<";
      conditions.push(
        `(created_at ${comparator} $${createdAtIndex}::timestamptz or (created_at = $${createdAtIndex}::timestamptz and id ${comparator} $${idIndex}))`
      );
    }

    const whereClause = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
    const direction = input.sort === "created_at_asc" ? "asc" : "desc";
    values.push(input.limit + 1);
    const limitIndex = values.length;

    const result = await this.client.query<ContributionPostRow>(
      `select id, creator_user_id, post_type, title, description, difficulty, credit_offer, state, created_at
       from contribution_posts
       ${whereClause}
       order by created_at ${direction}, id ${direction}
       limit $${limitIndex}`,
      values
    );

    const rows = result.rows.slice(0, input.limit);
    const items = rows.map(toPost);
    const hasMore = result.rows.length > input.limit;
    const cursorSource = rows[rows.length - 1];
    return {
      items,
      ...(hasMore && cursorSource
        ? { nextCursor: { createdAt: toIso(cursorSource.created_at), id: cursorSource.id } }
        : {})
    };
  }

  async getPostById(postId: string): Promise<ContributionPost | undefined> {
    const result = await this.client.query<ContributionPostRow>(
      `select id, creator_user_id, post_type, title, description, difficulty, credit_offer, state, created_at
       from contribution_posts
       where id = $1
       limit 1`,
      [postId]
    );
    const row = result.rows[0];
    return row ? toPost(row) : undefined;
  }

  async updatePostDetails(
    postId: string,
    update: Partial<Pick<ContributionPost, "title" | "description" | "difficulty" | "creditOffer">>
  ): Promise<ContributionPost> {
    const existing = await this.getPostById(postId);
    if (!existing) {
      throw new Error("contribution post not found");
    }

    const result = await this.client.query<ContributionPostRow>(
      `update contribution_posts
       set title = $1,
           description = $2,
           difficulty = $3,
           credit_offer = $4,
           updated_at = now()
       where id = $5
       returning id, creator_user_id, post_type, title, description, difficulty, credit_offer, state, created_at`,
      [
        update.title ?? existing.title,
        update.description ?? existing.description,
        update.difficulty ?? existing.difficulty,
        update.creditOffer ?? existing.creditOffer,
        postId
      ]
    );

    return toPost(result.rows[0] as ContributionPostRow);
  }

  async updatePostState(
    postId: string,
    state: ContributionPost["state"]
  ): Promise<ContributionPost> {
    const result = await this.client.query<ContributionPostRow>(
      `update contribution_posts
       set state = $1,
           updated_at = now()
       where id = $2
       returning id, creator_user_id, post_type, title, description, difficulty, credit_offer, state, created_at`,
      [state, postId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("contribution post not found");
    }

    return toPost(row);
  }

  async createApplication(input: {
    postId: string;
    applicantUserId: string;
    message: string;
  }): Promise<ContributionApplication> {
    const result = await this.client.query<ContributionApplicationRow>(
      `insert into contribution_applications
       (id, post_id, applicant_user_id, message, created_at)
       values ($1, $2, $3, $4, now())
       returning id, post_id, applicant_user_id, message, created_at`,
      [`app_${randomUUID()}`, input.postId, input.applicantUserId, input.message]
    );

    return toApplication(result.rows[0] as ContributionApplicationRow);
  }

  async listApplicationsByPost(postId: string): Promise<ContributionApplication[]> {
    const result = await this.client.query<ContributionApplicationRow>(
      `select id, post_id, applicant_user_id, message, created_at
       from contribution_applications
       where post_id = $1
       order by created_at asc`,
      [postId]
    );

    return result.rows.map(toApplication);
  }

  async createCollaboration(input: {
    postId: string;
    requesterUserId: string;
    contributorUserId: string;
  }): Promise<ContributionCollaboration> {
    const result = await this.client.query<ContributionCollaborationRow>(
      `insert into contribution_collaborations
       (id, post_id, requester_user_id, contributor_user_id, state, started_at, completed_at, created_at, updated_at)
       values ($1, $2, $3, $4, 'pending', null, null, now(), now())
       returning id, post_id, requester_user_id, contributor_user_id, state, started_at, completed_at`,
      [`col_${randomUUID()}`, input.postId, input.requesterUserId, input.contributorUserId]
    );

    return toCollaboration(result.rows[0] as ContributionCollaborationRow);
  }

  async getCollaborationById(
    collaborationId: string
  ): Promise<ContributionCollaboration | undefined> {
    const result = await this.client.query<ContributionCollaborationRow>(
      `select id, post_id, requester_user_id, contributor_user_id, state, started_at, completed_at
       from contribution_collaborations
       where id = $1
       limit 1`,
      [collaborationId]
    );
    const row = result.rows[0];
    return row ? toCollaboration(row) : undefined;
  }

  async updateCollaborationState(
    collaborationId: string,
    state: ContributionCollaboration["state"]
  ): Promise<ContributionCollaboration> {
    const result = await this.client.query<ContributionCollaborationRow>(
      `update contribution_collaborations
       set state = $1,
           updated_at = now()
       where id = $2
       returning id, post_id, requester_user_id, contributor_user_id, state, started_at, completed_at`,
      [state, collaborationId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("contribution collaboration not found");
    }
    return toCollaboration(row);
  }
}

class DbContributionEventRepository implements ContributionEventRepository {
  constructor(private readonly client: DatabaseClient) {}

  async appendEvent(event: ContributionDomainEvent): Promise<void> {
    await this.client.query(
      `insert into contribution_events
       (id, aggregate_type, aggregate_id, event_type, actor_user_id, payload_json, occurred_at, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())`,
      [
        event.id,
        event.aggregateType,
        event.aggregateId,
        event.type,
        event.actorUserId ?? null,
        event.payload ?? null,
        event.occurredAt
      ]
    );
  }

  async listEventsByAggregate(input: {
    aggregateType: ContributionDomainEvent["aggregateType"];
    aggregateId: string;
  }): Promise<ContributionDomainEvent[]> {
    const result = await this.client.query<ContributionEventRow>(
      `select id, aggregate_type, aggregate_id, event_type, actor_user_id, payload_json, occurred_at
       from contribution_events
       where aggregate_type = $1 and aggregate_id = $2
       order by occurred_at asc`,
      [input.aggregateType, input.aggregateId]
    );

    return result.rows.map(toEvent);
  }
}

const createInMemoryRepositories = (): {
  repository: ContributionRepository;
  eventRepository: ContributionEventRepository;
} => {
  return {
    repository: new InMemoryContributionRepository(),
    eventRepository: new InMemoryContributionEventRepository()
  };
};

export const createContributionPersistenceRuntime = (
  env: ApiEnv,
  dependencies: { databaseClient?: DatabaseClient } = {}
): {
  repository: ContributionRepository;
  eventRepository: ContributionEventRepository;
} => {
  void env;

  if (!dependencies.databaseClient) {
    return createInMemoryRepositories();
  }

  try {
    return {
      repository: new DbContributionRepository(dependencies.databaseClient),
      eventRepository: new DbContributionEventRepository(dependencies.databaseClient)
    };
  } catch (error) {
    log("error", "Contribution DB persistence initialization failed. Falling back to memory.", {
      error: error instanceof Error ? error.message : "unknown"
    });
    return createInMemoryRepositories();
  }
};
