# Realtime Security Boundaries

## Objective

Define security boundaries for realtime transport so collaboration updates remain safe, policy-enforced, and abuse-resilient.

## Auth Validation

- Every connection handshake must validate active session/auth identity.
- Session subject must resolve to existing actor model.
- Revoked/expired sessions must be disconnected immediately.

## Capability Validation

- Subscription requests require capability checks.
- Capabilities must map to existing role/capability infrastructure.
- Authorization must be re-evaluated on sensitive state changes when needed.

## Subscription Authorization

- Actor can subscribe only to:
  - own actor stream
  - authorized contribution rooms
- Moderator/admin subscriptions require explicit privileged capabilities.
- No direct client ability to subscribe to unrestricted/global channels.

## Abuse/Flood Protection

- Apply connection rate limits per IP/session/actor.
- Apply message frequency limits (client->server control messages).
- Enforce max subscriptions per connection.
- Reject malformed payloads early with structured errors.

## Replay/Spoof Concerns

- Server signs or validates cursor tokens as opaque trusted values.
- Ignore client-provided actor identifiers in events/commands.
- Prevent replay of stale auth claims after revocation.
- Require server-assigned connection identifiers.

## Sensitive Event Boundaries

- Never broadcast:
  - raw credential/session material
  - internal moderation notes
  - private verification evidence
- Event payloads should follow least-privilege data exposure.

## Operational Security

- Structured security logs for failed auth/subscription attempts.
- Monitor anomaly patterns (burst connects, repeated forbidden subscriptions).
- Provide incident-response hooks (disconnect actor/session, block source).

## MVP vs Deferred

### MVP

- Strong auth + subscription checks.
- Basic flood/rate controls.
- Sensitive payload minimization.

### Deferred

- Advanced bot/fraud heuristics.
- Regional policy controls and adaptive throttling.
- Automated incident mitigation workflows.

## OPEN_DECISION

1. Transport auth mechanism priority: cookie session, bearer token, or dual-mode.
2. Baseline rate-limit thresholds by actor/session/IP.
3. Whether to require signed cursor tokens in MVP or defer.
