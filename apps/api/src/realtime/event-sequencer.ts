import type { RealtimeSubscriptionTopic } from "@contriskill/contracts";

export class RealtimeEventSequencer {
  private readonly topicSequence = new Map<string, number>();

  next(topic: RealtimeSubscriptionTopic): number {
    const next = (this.topicSequence.get(topic) ?? 0) + 1;
    this.topicSequence.set(topic, next);
    return next;
  }

  reset(): void {
    this.topicSequence.clear();
  }
}
