import {
  realtimeClientEventNames,
  realtimeEventVersion,
  realtimeSubscriptionTopics,
  type RealtimeEventEnvelope,
  type RealtimeScope
} from "@contriskill/contracts";

import type { RealtimeTransportIncomingEnvelope } from "./types";

type ValidationResult =
  | { ok: true; value: RealtimeTransportIncomingEnvelope }
  | { ok: false; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isScope = (value: unknown): value is RealtimeScope => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value.type === "actor" || value.type === "contribution") &&
    typeof value.id === "string" &&
    value.id.trim().length > 0
  );
};

const isSupportedClientEventName = (
  value: unknown
): value is (typeof realtimeClientEventNames)[number] => {
  return typeof value === "string" && realtimeClientEventNames.includes(value as never);
};

const isSupportedTopic = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  if (realtimeSubscriptionTopics.includes(value as never)) {
    return true;
  }
  if (!value.startsWith("contribution:")) {
    return false;
  }
  const suffix = value.slice("contribution:".length);
  return suffix.length > 0;
};

const hasValidSubscriptionPayload = (payload: unknown): boolean => {
  if (!isRecord(payload) || !isRecord(payload.subscription)) {
    return false;
  }

  const subscription = payload.subscription;
  return isScope(subscription.scope) && isSupportedTopic(subscription.topic);
};

export const validateIncomingEnvelope = (raw: unknown): ValidationResult => {
  if (!isRecord(raw)) {
    return { ok: false, reason: "Realtime payload must be an object." };
  }

  const envelope = raw as RealtimeEventEnvelope<unknown>;
  if (typeof envelope.eventId !== "string" || envelope.eventId.trim().length === 0) {
    return { ok: false, reason: "Invalid eventId." };
  }

  if (!isSupportedClientEventName(envelope.eventName)) {
    return { ok: false, reason: `Unsupported client event "${String(envelope.eventName)}".` };
  }

  if (envelope.version !== realtimeEventVersion) {
    return {
      ok: false,
      reason: `Unsupported event version "${String(envelope.version)}".`
    };
  }

  if (typeof envelope.occurredAt !== "string" || Number.isNaN(Date.parse(envelope.occurredAt))) {
    return { ok: false, reason: "Invalid occurredAt timestamp." };
  }

  if (!isScope(envelope.scope)) {
    return { ok: false, reason: "Invalid scope." };
  }

  if (envelope.eventName === "system.heartbeat.pong.v1") {
    if (!isRecord(envelope.payload) || typeof envelope.payload.heartbeatAt !== "string") {
      return { ok: false, reason: "Invalid heartbeat payload." };
    }
    return { ok: true, value: envelope };
  }

  if (!hasValidSubscriptionPayload(envelope.payload)) {
    return { ok: false, reason: "Invalid subscription payload." };
  }

  return { ok: true, value: envelope };
};
