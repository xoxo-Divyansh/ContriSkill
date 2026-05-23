import { describe, expect, it } from "vitest";

import { RealtimeDiagnostics } from "../src/realtime/diagnostics";

describe("realtime diagnostics serialization", () => {
  it("returns non-sensitive snapshot with counters and safe samples", () => {
    const diagnostics = new RealtimeDiagnostics();
    diagnostics.increment("connectionAttempts");
    diagnostics.increment("connectionAccepted");

    const snapshot = diagnostics.snapshot({
      activeConnections: 1,
      reconnectSnapshotCount: 0,
      activeConnectionSamples: [
        {
          connectionId: "conn_1",
          actorType: "authenticated",
          role: "user",
          connectedAt: new Date().toISOString(),
          correlationId: "cid_1"
        }
      ]
    });

    expect(snapshot.counters.connectionAttempts).toBe(1);
    expect(snapshot.counters.connectionAccepted).toBe(1);
    expect(snapshot.activeConnectionSamples[0]?.connectionId).toBe("conn_1");
    expect(snapshot.generatedAt).toBeTypeOf("string");
  });
});
