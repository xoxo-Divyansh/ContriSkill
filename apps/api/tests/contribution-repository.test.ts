import { describe, expect, it } from "vitest";

import type { DatabaseClient } from "../src/db/postgres";
import { createContributionPersistenceRuntime } from "../src/modules/contribution/repository";
import { createContributionUnitOfWork } from "../src/modules/contribution/unit-of-work";

type QueryCall = {
  text: string;
  values?: readonly unknown[];
};

class FakeContributionDatabaseClient implements DatabaseClient {
  readonly calls: QueryCall[] = [];
  transactionCalls = 0;

  private readonly posts = new Map<string, Record<string, unknown>>();
  private readonly applications = new Map<string, Record<string, unknown>>();
  private readonly collaborations = new Map<string, Record<string, unknown>>();
  private readonly events: Record<string, unknown>[] = [];

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }> {
    if (values !== undefined) {
      this.calls.push({ text, values });
    } else {
      this.calls.push({ text });
    }

    if (text.includes("insert into contribution_posts")) {
      const [id, creatorUserId, postType, title, description, difficulty, creditOffer] =
        values ?? [];
      const row: Record<string, unknown> = {
        id,
        creator_user_id: creatorUserId,
        post_type: postType,
        title,
        description,
        difficulty,
        credit_offer: creditOffer,
        state: "open",
        created_at: new Date().toISOString()
      };
      this.posts.set(String(id), row);
      return { rows: [row as T] };
    }

    if (text.includes("from contribution_posts") && text.includes("where id = $1")) {
      const row = this.posts.get(String(values?.[0]));
      return { rows: (row ? [row] : []) as T[] };
    }

    if (text.includes("update contribution_posts") && text.includes("set title = $1")) {
      const [title, description, difficulty, creditOffer, id] = values ?? [];
      const row = this.posts.get(String(id));
      if (!row) {
        return { rows: [] as T[] };
      }
      row.title = title;
      row.description = description;
      row.difficulty = difficulty;
      row.credit_offer = creditOffer;
      return { rows: [row as T] };
    }

    if (text.includes("update contribution_posts") && text.includes("set state = $1")) {
      const [state, id] = values ?? [];
      const row = this.posts.get(String(id));
      if (!row) {
        return { rows: [] as T[] };
      }
      row.state = state;
      return { rows: [row as T] };
    }

    if (text.includes("insert into contribution_applications")) {
      const [id, postId, applicantUserId, message] = values ?? [];
      const row: Record<string, unknown> = {
        id,
        post_id: postId,
        applicant_user_id: applicantUserId,
        message,
        created_at: new Date().toISOString()
      };
      this.applications.set(String(id), row);
      return { rows: [row as T] };
    }

    if (text.includes("from contribution_applications")) {
      const postId = String(values?.[0]);
      const rows = [...this.applications.values()].filter((row) => row.post_id === postId);
      return { rows: rows as T[] };
    }

    if (text.includes("insert into contribution_collaborations")) {
      const [id, postId, requesterUserId, contributorUserId] = values ?? [];
      const row: Record<string, unknown> = {
        id,
        post_id: postId,
        requester_user_id: requesterUserId,
        contributor_user_id: contributorUserId,
        state: "pending",
        started_at: null,
        completed_at: null
      };
      this.collaborations.set(String(id), row);
      return { rows: [row as T] };
    }

    if (text.includes("from contribution_collaborations") && text.includes("where id = $1")) {
      const row = this.collaborations.get(String(values?.[0]));
      return { rows: (row ? [row] : []) as T[] };
    }

    if (text.includes("update contribution_collaborations")) {
      const [state, id] = values ?? [];
      const row = this.collaborations.get(String(id));
      if (!row) {
        return { rows: [] as T[] };
      }
      row.state = state;
      return { rows: [row as T] };
    }

    if (text.includes("insert into contribution_events")) {
      const [id, aggregateType, aggregateId, eventType, actorUserId, payloadJson, occurredAt] =
        values ?? [];
      this.events.push({
        id,
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        event_type: eventType,
        actor_user_id: actorUserId,
        payload_json: payloadJson,
        occurred_at: occurredAt
      });
      return { rows: [] as T[] };
    }

    if (text.includes("from contribution_events")) {
      const [aggregateType, aggregateId] = values ?? [];
      const rows = this.events.filter(
        (event) => event.aggregate_type === aggregateType && event.aggregate_id === aggregateId
      );
      return { rows: rows as T[] };
    }

    return { rows: [] as T[] };
  }

  async transaction<T>(work: (client: DatabaseClient) => Promise<T>): Promise<T> {
    this.transactionCalls += 1;
    return work(this);
  }
}

describe("contribution DB persistence foundation", () => {
  it("persists post/application/collaboration/event using DB-backed repositories", async () => {
    const dbClient = new FakeContributionDatabaseClient();
    const runtime = createContributionPersistenceRuntime(
      {
        nodeEnv: "test",
        logLevel: "info",
        port: 4000,
        wsCorsOrigin: "http://localhost:3000",
        sessionTtlMinutes: 30
      },
      { databaseClient: dbClient }
    );

    const post = await runtime.repository.createPost({
      creatorUserId: "usr_1",
      type: "mentorship",
      title: "Need help",
      description: "Need architecture help",
      difficulty: "medium",
      creditOffer: 40
    });

    const application = await runtime.repository.createApplication({
      postId: post.id,
      applicantUserId: "usr_2",
      message: "I can help"
    });

    const collaboration = await runtime.repository.createCollaboration({
      postId: post.id,
      requesterUserId: "usr_1",
      contributorUserId: "usr_2"
    });

    await runtime.eventRepository.appendEvent({
      id: "evt_1",
      type: "collaboration.started",
      aggregateType: "collaboration",
      aggregateId: collaboration.id,
      actorUserId: "usr_1",
      occurredAt: new Date().toISOString()
    });

    const events = await runtime.eventRepository.listEventsByAggregate({
      aggregateType: "collaboration",
      aggregateId: collaboration.id
    });

    expect(post.id).toContain("post_");
    expect(application.postId).toBe(post.id);
    expect(collaboration.postId).toBe(post.id);
    expect(events).toHaveLength(1);
  });

  it("builds transaction-backed unit-of-work when DB supports transactions", async () => {
    const dbClient = new FakeContributionDatabaseClient();
    const unitOfWork = createContributionUnitOfWork(dbClient);

    expect(unitOfWork).toBeDefined();
    await unitOfWork?.run(async () => {
      await dbClient.query("select 1");
    });
    expect(dbClient.transactionCalls).toBe(1);
  });
});
