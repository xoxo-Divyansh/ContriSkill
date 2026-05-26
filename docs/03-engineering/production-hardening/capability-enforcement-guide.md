# Capability Enforcement Guide

## Principles
- Use capability middleware for all protected routes.
- Keep authorization errors normalized by centralized response helpers.
- Emit security events for denied capability requests to support audits.

## Middleware Contract
- `requireAuthMiddleware`: validates authenticated actor boundary.
- `requireCapabilityMiddleware(capability)`: enforces route capability.
- Shared handler converts authorization failures into:
  - `401 UNAUTHENTICATED`
  - `403 FORBIDDEN`

## Auditability
- Denials emit `capability_denied` security events with capability, actor shape, method, path, and client context.
- Authentication failures emit `auth_failure` events with equivalent request context.

## Review Checklist
- Route has both auth and capability middleware where required.
- Capability string exists in centralized capability map.
- API error contract stays stable (`code` + `message` envelope).
